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
  const margin = 20;
  let yPosition = margin;

  // Title
  doc.setFontSize(16);
  doc.text('Video Recovery Notes', margin, yPosition);
  yPosition += 10;

  // Basic information
  doc.setFontSize(12);
  yPosition += 10;
  doc.text(`OCC#: ${formData.occ}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Date: ${DateTime.fromISO(formData.onSceneArrival).toFormat('yyyy-MM-dd')}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Location: ${formData.address}`, margin, yPosition);
  yPosition += 8;

  // Add generated notes
  yPosition += 10;
  doc.text('Notes:', margin, yPosition);
  yPosition += 8;

  const notes = generateNotes(formData).split('\n');
  notes.forEach(note => {
    // Handle page overflow
    if (yPosition > 270) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(note, margin, yPosition);
    yPosition += 8;
  });

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