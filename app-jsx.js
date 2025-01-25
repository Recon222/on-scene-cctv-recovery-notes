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
                {/* Basic Information Section */}
                <div className="row g-3">
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
                    />
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

                  {/* Continue with all form fields following the same pattern... */}
                  {/* I'm truncating here for brevity but can show the rest if needed */}

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