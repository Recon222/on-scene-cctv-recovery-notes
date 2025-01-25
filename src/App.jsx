import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import {
  calculateTimeDifference,
  calculateCorrectedTime,
  calculateRetention,
  generateNotes,
  exportToPDF,
  exportToJSON
} from './utils';

const initialFormState = {
  // Basic Info
  occ: '',
  requestedBy: '',
  badge: '',
  unit: '',
  address: '',
  locationContact: '',
  locationPhone: '',
  
  // Timing
  requestReceived: '',
  extractFrom: '',
  extractTo: '',
  timeType: 'actual_time',
  correctedDvrFrom: '',
  correctedDvrTo: '',
  correctedRealFrom: '',
  correctedRealTo: '',
  onSceneArrival: '',
  onSceneDeparture: '',
  
  // DVR Info
  dvrLocation: '',
  dvrType: '',
  serialNumber: '',
  numChannels: '',
  activeCameras: '',
  dvrDatetime: '',
  actualDatetime: '',
  timeDifference: null,
  retention: '',
  username: '',
  password: '',
  recordingResolution: '',
  customResolution: '',
  recordingFps: '',
  customFps: '',
  recordingSchedule: [],
  
  // Export Info
  exportMedia: '',
  mediaPlayer: '',
  fileType: '',
  notes: '',
  dateCompleted: '',
  timeCompleted: '',
  sizeGb: '',
  mediaProvidedVia: '',
  completedBy: ''
};

const App = () => {
  // State
  const [formData, setFormData] = useState(initialFormState);
  const [generatedNotes, setGeneratedNotes] = useState('');
  
  // Load saved form data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('formData');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('formData', JSON.stringify(formData));
  }, [formData]);

  // Auto-fill current time for specified fields when focused
  const handleTimeFieldFocus = (fieldName) => {
    if (!formData[fieldName]) {
      const now = DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm");
      setFormData(prev => ({ ...prev, [fieldName]: now }));
    }
  };

  // Calculate time difference and corrected times when DVR or actual time changes
  useEffect(() => {
    if (formData.dvrDatetime && formData.actualDatetime) {
      const difference = calculateTimeDifference(formData.dvrDatetime, formData.actualDatetime);
      setFormData(prev => ({ ...prev, timeDifference: difference }));
    }
  }, [formData.dvrDatetime, formData.actualDatetime]);

  // Update corrected times when relevant fields change
  useEffect(() => {
    if (formData.extractFrom && formData.extractTo && formData.timeDifference) {
      const isActualTime = formData.timeType === 'actual_time';
      const correctedFrom = calculateCorrectedTime(formData.extractFrom, formData.timeDifference, isActualTime);
      const correctedTo = calculateCorrectedTime(formData.extractTo, formData.timeDifference, isActualTime);

      setFormData(prev => ({
        ...prev,
        correctedDvrFrom: isActualTime ? correctedFrom : '',
        correctedDvrTo: isActualTime ? correctedTo : '',
        correctedRealFrom: !isActualTime ? correctedFrom : '',
        correctedRealTo: !isActualTime ? correctedTo : ''
      }));
    }
  }, [formData.extractFrom, formData.extractTo, formData.timeDifference, formData.timeType]);

  // Generate notes when relevant fields change
  useEffect(() => {
    const notes = generateNotes(formData);
    setFormData(prev => ({ ...prev, notes: notes }));
    setGeneratedNotes(notes);
  }, [
    formData.address,
    formData.onSceneArrival,
    formData.onSceneDeparture,
    formData.extractFrom,
    formData.extractTo,
    formData.timeDifference,
    formData.correctedDvrFrom,
    formData.correctedDvrTo,
    formData.sizeGb,
    formData.exportMedia,
    formData.mediaProvidedVia,
    formData.retention
  ]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const scheduleArray = [...formData.recordingSchedule];
      if (e.target.checked) {
        scheduleArray.push(value);
      } else {
        const index = scheduleArray.indexOf(value);
        if (index > -1) {
          scheduleArray.splice(index, 1);
        }
      }
      setFormData(prev => ({ ...prev, recordingSchedule: scheduleArray }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Confirm before saving
    if (window.confirm('Save notes and export files?')) {
      try {
        // Export to PDF and JSON
        exportToPDF(formData);
        exportToJSON(formData);
        
        // Show success message
        alert('Notes saved and files exported successfully!');
      } catch (error) {
        console.error('Error saving notes:', error);
        alert('Error saving notes. Please try again.');
      }
    }
  };

  // Handle custom resolution/FPS fields
  const handleCustomField = (field, value) => {
    if (value === 'custom') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        [`custom${field.charAt(0).toUpperCase() + field.slice(1)}`]: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        [`custom${field.charAt(0).toUpperCase() + field.slice(1)}`]: ''
      }));
    }
  };

  return (
    <div className="container-xl py-5">
      <div className="row justify-content-center">
        <div className="col-xl-12">
          <div className="card shadow" style={{ maxWidth: '1140px', margin: '0 auto' }}>
            <div className="card-body">
              <h1 className="card-title text-center mb-4">On-Site Video Recovery Notes</h1>
              
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Basic Information */}
                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="occ" className="form-label">Occ #:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="occ"
                      name="occ"
                      value={formData.occ}
                      onChange={handleInputChange}
                      required
                      list="recentOCCList"
                    />
                    <datalist id="recentOCCList">
                      {/* Recent OCCs will be populated here */}
                    </datalist>
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="requestedBy" className="form-label">Requested by:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="requestedBy"
                      name="requestedBy"
                      value={formData.requestedBy}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="badge" className="form-label">Badge #:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="badge"
                      name="badge"
                      value={formData.badge}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="unit" className="form-label">Unit:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Location Information */}
                  <div className="col-12 col-lg-6">
                    <label htmlFor="address" className="form-label">Address/Business Name:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="locationContact" className="form-label">Location Contact:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="locationContact"
                      name="locationContact"
                      value={formData.locationContact}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="locationPhone" className="form-label">Location Phone Number:</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="locationPhone"
                      name="locationPhone"
                      value={formData.locationPhone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Time Information */}
                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="requestReceived" className="form-label">Request Received:</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="requestReceived"
                      name="requestReceived"
                      value={formData.requestReceived}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label">Date/Time to Extract:</label>
                    <div className="row">
                      <div className="col-md-6">
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="extractFrom"
                          name="extractFrom"
                          value={formData.extractFrom}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="extractTo"
                          name="extractTo"
                          value={formData.extractTo}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label className="form-label">Time Type:</label>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="timeType"
                        id="actualTime"
                        value="actual_time"
                        checked={formData.timeType === 'actual_time'}
                        onChange={handleInputChange}
                        required
                      />
                      <label className="form-check-label" htmlFor="actualTime">
                        Actual Time
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="timeType"
                        id="dvrTime"
                        value="dvr_time"
                        checked={formData.timeType === 'dvr_time'}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="dvrTime">
                        DVR Time
                      </label>
                    </div>
                  </div>

                  {/* Corrected Times Display */}
                  <div className="col-12 col-lg-6">
                    <label className="form-label">Corrected DVR Time:</label>
                    <div className="row">
                      <div className="col-md-6">
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="correctedDvrFrom"
                          value={formData.correctedDvrFrom}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="correctedDvrTo"
                          value={formData.correctedDvrTo}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label">Corrected Real Time:</label>
                    <div className="row">
                      <div className="col-md-6">
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="correctedRealFrom"
                          value={formData.correctedRealFrom}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="correctedRealTo"
                          value={formData.correctedRealTo}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* On Scene Times */}
                  <div className="col-12">
                    <div className="row">
                      <div className="col-md-6">
                        <label htmlFor="onSceneArrival" className="form-label">
                          On-Scene Arrival Date/Time:
                        </label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="onSceneArrival"
                          name="onSceneArrival"
                          value={formData.onSceneArrival}
                          onChange={handleInputChange}
                          onFocus={() => handleTimeFieldFocus('onSceneArrival')}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="onSceneDeparture" className="form-label">
                          On-Scene Departure Date/Time:
                        </label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="onSceneDeparture"
                          name="onSceneDeparture"
                          value={formData.onSceneDeparture}
                          onChange={handleInputChange}
                          onFocus={() => handleTimeFieldFocus('onSceneDeparture')}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* DVR Information Section */}
                  <div className="col-12">
                    <h4 className="mt-4">DVR INFORMATION</h4>
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="dvrLocation" className="form-label">DVR Location:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="dvrLocation"
                      name="dvrLocation"
                      value={formData.dvrLocation}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="dvrType" className="form-label">DVR Type/Brand:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="dvrType"
                      name="dvrType"
                      value={formData.dvrType}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="serialNumber" className="form-label">Serial Number/Model Number:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="serialNumber"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-3 col-lg-1">
                    <label htmlFor="numChannels" className="form-label">Number of Channels:</label>
                    <input
                      type="number"
                      className="form-control"
                      id="numChannels"
                      name="numChannels"
                      value={formData.numChannels}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-3 col-lg-1">
                    <label htmlFor="activeCameras" className="form-label">Active Cameras:</label>
                    <input
                      type="number"
                      className="form-control"
                      id="activeCameras"
                      name="activeCameras"
                      value={formData.activeCameras}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="dvrDatetime" className="form-label">DVR Date/Time:</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="dvrDatetime"
                      name="dvrDatetime"
                      value={formData.dvrDatetime}
                      onChange={handleInputChange}
                      onFocus={() => handleTimeFieldFocus('dvrDatetime')}
                      step="1"
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="actualDatetime" className="form-label">Actual Date/Time:</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="actualDatetime"
                      name="actualDatetime"
                      value={formData.actualDatetime}
                      onChange={handleInputChange}
                      onFocus={() => handleTimeFieldFocus('actualDatetime')}
                      step="1"
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="timeDifference" className="form-label">Time Difference:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="timeDifference"
                      value={formData.timeDifference ? 
                        `DVR is ${formData.timeDifference.formatted} ${formData.timeDifference.direction} real time` : 
                        ''}
                      readOnly
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="retention" className="form-label">First Recording Date:</label>
                    <input
                      type="date"
                      className="form-control"
                      id="retention"
                      name="retention"
                      value={formData.retention}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="username" className="form-label">User Name:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="password" className="form-label">Password:</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 col-lg-2">
                    <label htmlFor="recordingResolution" className="form-label">Recording Resolution:</label>
                    <select
                      className="form-select"
                      id="recordingResolution"
                      name="recordingResolution"
                      value={formData.recordingResolution}
                      onChange={(e) => handleCustomField('recordingResolution', e.target.value)}
                      required
                    >
                      <option value="">Select resolution</option>
                      <option value="352x240">352x240 (CIF)</option>
                      <option value="704x480">704x480 (4CIF)</option>
                      <option value="960x480">960x480 (960H)</option>
                      <option value="1280x720">1280x720 (720p)</option>
                      <option value="1920x1080">1920x1080 (1080p)</option>
                      <option value="2560x1440">2560x1440 (1440p)</option>
                      <option value="3840x2160">3840x2160 (4K)</option>
                      <option value="custom">Custom</option>
                    </select>
                    {formData.recordingResolution === 'custom' && (
                      <input
                        type="text"
                        className="form-control mt-2"
                        id="customResolution"
                        name="customResolution"
                        placeholder="Custom resolution"
                        value={formData.customResolution}
                        onChange={handleInputChange}
                      />
                    )}
                  </div>

                  <div className="col-md-4 col-lg-2">
                    <label htmlFor="recordingFps" className="form-label">Recording FPS:</label>
                    <select
                      className="form-select"
                      id="recordingFps"
                      name="recordingFps"
                      value={formData.recordingFps}
                      onChange={(e) => handleCustomField('recordingFps', e.target.value)}
                      required
                    >
                      <option value="">Select FPS</option>
                      <option value="1">1 FPS</option>
                      <option value="2">2 FPS</option>
                      <option value="3">3 FPS</option>
                      <option value="4">4 FPS</option>
                      <option value="5">5 FPS</option>
                      <option value="10">10 FPS</option>
                      <option value="15">15 FPS</option>
                      <option value="20">20 FPS</option>
                      <option value="25">25 FPS</option>
                      <option value="30">30 FPS</option>
                      <option value="custom">Custom</option>
                    </select>
                    {formData.recordingFps === 'custom' && (
                      <input
                        type="number"
                        className="form-control mt-2"
                        id="customFps"
                        name="customFps"
                        placeholder="Custom FPS"
                        value={formData.customFps}
                        onChange={handleInputChange}
                      />
                    )}
                  </div>

                  <div className="col-md-4 col-lg-2">
                    <label className="form-label">Recording Schedule:</label>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="continuous"
                        name="recordingSchedule"
                        value="continuous"
                        checked={formData.recordingSchedule.includes('continuous')}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="continuous">
                        Continuous
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="motion"
                        name="recordingSchedule"
                        value="motion"
                        checked={formData.recordingSchedule.includes('motion')}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="motion">
                        Motion
                      </label>
                    </div>
                  </div>

                  <div className="col-md-4 col-lg-2">
                    <label htmlFor="exportMedia" className="form-label">Export Media:</label>
                    <select
                      className="form-select"
                      id="exportMedia"
                      name="exportMedia"
                      value={formData.exportMedia}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select export media</option>
                      <option value="USB">USB</option>
                      <option value="USB HDD">USB HDD</option>
                      <option value="SD Card">SD Card</option>
                      <option value="CD">CD</option>
                      <option value="DVD">DVD</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-4 col-lg-2">
                    <label htmlFor="mediaPlayer" className="form-label">MediaPlayer Included:</label>
                    <select
                      className="form-select"
                      id="mediaPlayer"
                      name="mediaPlayer"
                      value={formData.mediaPlayer}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Please Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="col-md-4 col-lg-2">
                    <label htmlFor="fileType" className="form-label">File Type:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="fileType"
                      name="fileType"
                      value={formData.fileType}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label htmlFor="notes" className="form-label">Notes:</label>
                    <textarea
                      className="form-control"
                      id="notes"
                      name="notes"
                      rows="8"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="dateCompleted" className="form-label">Date Completed:</label>
                    <input
                      type="date"
                      className="form-control"
                      id="dateCompleted"
                      name="dateCompleted"
                      value={formData.dateCompleted}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label htmlFor="timeCompleted" className="form-label">Time Completed:</label>
                    <input
                      type="time"
                      className="form-control"
                      id="timeCompleted"
                      name="timeCompleted"
                      value={formData.timeCompleted}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 col-lg-2">
                    <label htmlFor="sizeGb" className="form-label">Size in GB:</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className="form-control"
                      id="sizeGb"
                      name="sizeGb"
                      value={formData.sizeGb}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-8 col-lg-4">
                    <label htmlFor="mediaProvidedVia" className="form-label">Media Provided Via:</label>
                    <select
                      className="form-select"
                      id="mediaProvidedVia"
                      name="mediaProvidedVia"
                      value={formData.mediaProvidedVia}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select media provision method</option>
                      <option value="Video Evidence Drive">Video Evidence Drive</option>
                      <option value="evidence.com">evidence.com</option>
                      <option value="USB to Requester">USB to Requester</option>
                      <option value="HDD to Requester">HDD to Requester</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-12 col-lg-4">
                    <label htmlFor="completedBy" className="form-label">Completed by:</label>
                    <select
                      className="form-select"
                      id="completedBy"
                      name="completedBy"
                      value={formData.completedBy}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select analyst</option>
                      <option value="Kris CAESAR #3299c">Kris CAESAR #3299c Forensic Video Analyst</option>
                      <option value="Veronica Ceolin #N4886">Veronica Ceolin #N4886 Forensic Video Technician</option>
                    </select>
                  </div>

                  <div className="col-12 mt-4">
                    <button type="submit" className="btn btn-primary">Save Notes</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 