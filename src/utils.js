import { DateTime } from 'luxon';
import jsPDF from 'jspdf';

// Time calculation utilities
export const calculateTimeDifference = (dvrDateTime, actualDateTime) => {
  if (!dvrDateTime || !actualDateTime) return null;
  
  const dvr = DateTime.fromISO(dvrDateTime);
  const actual = DateTime.fromISO(actualDateTime);
  
  if (!dvr.isValid || !actual.isValid) return null;
  
  const diff = dvr.diff(actual);
  const isAhead = diff.as('milliseconds') >= 0;
  const hours = Math.floor(Math.abs(diff.as('hours')));
  const minutes = Math.floor(Math.abs(diff.as('minutes')) % 60);
  const seconds = Math.floor(Math.abs(diff.as('seconds')) % 60);

  return {
    formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    isAhead,
    totalMilliseconds: Math.abs(diff.as('milliseconds')),
    direction: isAhead ? 'AHEAD of' : 'BEHIND'
  };
};

export const calculateCorrectedTime = (extractTime, timeDifference, isActualTime) => {
  if (!extractTime || !timeDifference) return null;
  
  const time = DateTime.fromISO(extractTime);
  if (!time.isValid) return null;

  const adjustment = isActualTime ? 
    timeDifference.totalMilliseconds * (timeDifference.isAhead ? 1 : -1) :
    timeDifference.totalMilliseconds * (timeDifference.isAhead ? -1 : 1);

  return time.plus({ milliseconds: adjustment }).toFormat("yyyy-MM-dd'T'HH:mm:ss");
};

export const calculateRetention = (onSceneTime, firstRecordedDate, scopeDate) => {
  if (!onSceneTime || !firstRecordedDate || !scopeDate) return null;

  const onScene = DateTime.fromISO(onSceneTime);
  const firstRecorded = DateTime.fromISO(firstRecordedDate);
  const scope = DateTime.fromISO(scopeDate);

  if (!onScene.isValid || !firstRecorded.isValid || !scope.isValid) return null;

  const totalRetention = Math.floor(onScene.diff(firstRecorded, 'days').days);
  const overwriteDate = firstRecorded.plus({ days: totalRetention });
  const daysUntilOverwrite = Math.floor(overwriteDate.diff(scope, 'days').days);

  return {
    totalRetention,
    daysUntilOverwrite
  };
};

// Note generation
export const generateNotes = (formData) => {
  const notes = [];

  // Location and time note
  if (formData.address && formData.onSceneArrival) {
    const arrivalTime = DateTime.fromISO(formData.onSceneArrival).toFormat("yyyy-MM-dd @ HHmm 'hrs'");
    notes.push(`• Attended ${formData.address} on ${arrivalTime} to recover requested video evidence.`);
  }

  // Time extraction note
  if (formData.extractFrom && formData.extractTo && formData.timeDifference) {
    const isActualTime = formData.timeType === 'actual_time';
    
    const requestedFromTime = DateTime.fromISO(formData.extractFrom).toFormat("yyyy-MM-dd HHmm 'hrs'");
    const requestedToTime = DateTime.fromISO(formData.extractTo).toFormat("yyyy-MM-dd HHmm 'hrs'");
    
    let correctedFromTime, correctedToTime;
    
    if (isActualTime) {
      correctedFromTime = DateTime.fromISO(formData.correctedDvrFrom).toFormat("yyyy-MM-dd HHmm 'hrs'");
      correctedToTime = DateTime.fromISO(formData.correctedDvrTo).toFormat("yyyy-MM-dd HHmm 'hrs'");
      notes.push(
        `• Recovered requested cameras from ${requestedFromTime} to ${requestedToTime} (actual time, requested)/ ${correctedFromTime} to ${correctedToTime} (DVR time, corrected)`
      );
    } else {
      correctedFromTime = DateTime.fromISO(formData.correctedRealFrom).toFormat("yyyy-MM-dd HHmm 'hrs'");
      correctedToTime = DateTime.fromISO(formData.correctedRealTo).toFormat("yyyy-MM-dd HHmm 'hrs'");
      notes.push(
        `• Recovered requested cameras from ${requestedFromTime} to ${requestedToTime} (DVR time, requested)/ ${correctedFromTime} to ${correctedToTime} (actual time, corrected)`
      );
    }

    if (formData.timeDifference.formatted !== '00:00:00') {
      notes.push(`• Time offset: DVR is ${formData.timeDifference.formatted} ${formData.timeDifference.direction} real time.`);
    }
  }

  // Time on scene note
  if (formData.onSceneArrival && formData.onSceneDeparture) {
    const arrival = DateTime.fromISO(formData.onSceneArrival);
    const departure = DateTime.fromISO(formData.onSceneDeparture);
    const duration = departure.diff(arrival, ['hours', 'minutes']);
    const hours = Math.floor(duration.hours);
    const minutes = Math.floor(duration.minutes);
    const timeStr = hours > 0 ? 
      `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}` :
      `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    
    notes.push(`• Total time on scene: ${timeStr} (${arrival.toFormat('HH:mm')}-${departure.toFormat('HH:mm')})`);
  }

  // Export note
  if (formData.sizeGb && formData.exportMedia && formData.mediaProvidedVia) {
    let exportNote = `• ${formData.sizeGb}GB exported to ${formData.exportMedia}`;
    
    switch (formData.mediaProvidedVia) {
      case 'Video Evidence Drive':
        exportNote += ', uploaded to video evidence drive.';
        break;
      case 'evidence.com':
        exportNote += ', uploaded to evidence.com';
        break;
      case 'USB to Requester':
        exportNote += ', provided directly to requester.';
        break;
      case 'HDD to Requester':
        exportNote += ', provided directly to requester.';
        break;
      default:
        exportNote += `, ${formData.mediaProvidedVia}.`;
    }
    
    notes.push(exportNote);
  }

  // Retention warning if applicable
  if (formData.retention) {
    const { totalRetention, daysUntilOverwrite } = calculateRetention(
      formData.onSceneArrival,
      formData.retention,
      formData.extractFrom
    );

    if (totalRetention) {
      notes.push(`• DVR retention period: ${totalRetention} days`);
      
      if (daysUntilOverwrite > 0 && daysUntilOverwrite < 7) {
        notes.push(`- WARNING: Video will be overwritten in ${daysUntilOverwrite} days`);
      }
    }
  }

  return notes.join('\n');
};

// Export utilities
export const exportToPDF = (formData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // Helper function for text wrapping
  const splitText = (text, maxWidth) => {
    return doc.splitTextToSize(text, maxWidth);
  };

  // Helper function to add a new page if needed
  const checkPageBreak = (height) => {
    if (yPosition + height > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Set default font styles
  doc.setFont('helvetica');
  
  // Add logo placeholder (80x40 pixels)
  doc.rect(margin, yPosition, 40, 20);
  doc.setFontSize(8);
  doc.text('Agency Logo', margin + 5, yPosition + 12);
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Video Recovery Notes', pageWidth/2, yPosition + 10, { align: 'center' });
  yPosition += 25;

  // Basic Information Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setDrawColor(0);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 7, 'F');
  doc.text('CASE INFORMATION', margin + 2, yPosition + 5);
  yPosition += 12;

  // Case details in two columns
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const col1Width = 70;
  const col2Width = 80;
  
  // Column 1
  doc.text(`OCC#: ${formData.occ}`, margin, yPosition);
  doc.text(`Unit: ${formData.unit}`, margin, yPosition + 6);
  doc.text(`Requested by: ${formData.requestedBy}`, margin, yPosition + 12);
  
  // Column 2
  doc.text(`Badge#: ${formData.badge}`, margin + col1Width, yPosition + 12);
  doc.text(`Request Received: ${DateTime.fromISO(formData.requestReceived).toFormat('yyyy-MM-dd HH:mm')}`, margin + col1Width, yPosition + 6);
  
  yPosition += 20;

  // Location Information Section
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 7, 'F');
  doc.text('LOCATION DETAILS', margin + 2, yPosition + 5);
  yPosition += 12;

  doc.setFont('helvetica', 'normal');
  const locationText = splitText(`Address: ${formData.address}`, pageWidth - (margin * 2));
  doc.text(locationText, margin, yPosition);
  yPosition += (locationText.length * 5);
  
  doc.text(`Contact: ${formData.locationContact}`, margin, yPosition);
  doc.text(`Phone: ${formData.locationPhone}`, margin + col1Width, yPosition);
  yPosition += 10;

  // DVR Information Section
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 7, 'F');
  doc.text('DVR SPECIFICATIONS', margin + 2, yPosition + 5);
  yPosition += 12;

  doc.setFont('helvetica', 'normal');
  doc.text(`Location: ${formData.dvrLocation}`, margin, yPosition);
  doc.text(`Type/Brand: ${formData.dvrType}`, margin + col1Width, yPosition);
  yPosition += 6;
  
  doc.text(`Serial/Model #: ${formData.serialNumber}`, margin, yPosition);
  doc.text(`Channels: ${formData.numChannels}`, margin + col1Width, yPosition);
  yPosition += 6;
  
  doc.text(`Resolution: ${formData.recordingResolution}`, margin, yPosition);
  doc.text(`FPS: ${formData.recordingFps}`, margin + col1Width, yPosition);
  yPosition += 6;
  
  doc.text(`Username: ${formData.username}`, margin, yPosition);
  doc.text(`Password: ${formData.password}`, margin + col1Width, yPosition);
  yPosition += 10;

  // Time Information Section
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 7, 'F');
  doc.text('TIME INFORMATION', margin + 2, yPosition + 5);
  yPosition += 12;

  doc.setFont('helvetica', 'normal');
  const timeOffset = formData.timeDifference ? 
    `DVR is ${formData.timeDifference.formatted} ${formData.timeDifference.direction} real time` :
    'No time offset';
  doc.text(`Time Offset: ${timeOffset}`, margin, yPosition);
  yPosition += 6;

  // Format time range based on timeType
  const timeRangeText = `Extraction Period: ${DateTime.fromISO(formData.extractFrom).toFormat('yyyy-MM-dd HH:mm')} to ${DateTime.fromISO(formData.extractTo).toFormat('yyyy-MM-dd HH:mm')}`;
  doc.text(timeRangeText, margin, yPosition);
  yPosition += 10;

  // Notes Section
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 7, 'F');
  doc.text('RECOVERY NOTES', margin + 2, yPosition + 5);
  yPosition += 12;

  doc.setFont('helvetica', 'normal');
  const notes = formData.notes.split('\n');
  notes.forEach(note => {
    const wrappedNote = splitText(note, pageWidth - (margin * 2) - 5);
    checkPageBreak(wrappedNote.length * 5);
    doc.text(wrappedNote, margin, yPosition);
    yPosition += (wrappedNote.length * 5) + 2;
  });

  // Completion Information
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 7, 'F');
  doc.text('COMPLETION DETAILS', margin + 2, yPosition + 5);
  yPosition += 12;

  doc.setFont('helvetica', 'normal');
  doc.text(`Completed by: ${formData.completedBy}`, margin, yPosition);
  doc.text(`Date: ${formData.dateCompleted}`, margin, yPosition + 6);
  doc.text(`Time: ${formData.timeCompleted}`, margin + col1Width, yPosition + 6);
  
  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - margin);
  }

  // Save the PDF
  doc.save(`${formData.occ}_video_recovery_notes.pdf`);
};

export const exportToJSON = (formData) => {
  const jsonString = JSON.stringify(formData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${formData.occ}_video_recovery_data.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};