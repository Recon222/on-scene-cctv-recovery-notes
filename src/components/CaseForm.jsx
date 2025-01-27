import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { Locate, ArrowLeft } from 'lucide-react';
import {
  calculateTimeDifference,
  calculateCorrectedTime,
  calculateRetention,
  generateNotes,
  exportToPDF,
  exportToJSON
} from '../utils';
import { useGeolocation } from '../hooks/useGeolocation';
import { useNavigate } from 'react-router-dom';

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
  useIndividualCameras: false,
  cameras: [],
  
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

const CaseForm = ({ occ, onSave }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [activeSection, setActiveSection] = useState('submission');
  const { getLocation, isLoading, error } = useGeolocation();
  
  // Load existing data
  useEffect(() => {
    const savedData = localStorage.getItem(`formData_${occ || 'draft'}`);
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, [occ]);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(`formData_${occ || 'draft'}`, JSON.stringify(formData));
  }, [formData, occ]);

  const handleTimeFieldFocus = (fieldName) => {
    if (!formData[fieldName]) {
      const now = DateTime.now();
      const timeFormat = ['onSceneArrival', 'onSceneDeparture', 'actualDatetime'].includes(fieldName) 
        ? "yyyy-MM-dd'T'HH:mm:ss"
        : fieldName === 'retention'
        ? "yyyy-MM-dd"
        : "yyyy-MM-dd'T'HH:mm";
      setFormData(prev => ({ ...prev, [fieldName]: now.toFormat(timeFormat) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAndContinue = () => {
    // Save current progress
    localStorage.setItem(`formData_${occ || 'draft'}`, JSON.stringify(formData));
    
    // Move to next section
    switch (activeSection) {
      case 'submission':
        setActiveSection('timing');
        break;
      case 'timing':
        setActiveSection('dvr');
        break;
      case 'dvr':
        setActiveSection('export');
        break;
      case 'export':
        // Final save and return to list
        if (onSave) {
          onSave(formData);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="container-xl py-3">
      <div className="row justify-content-center">
        <div className="col-xl-12">
          <div className="card shadow">
            <div className="card-body">
              <div className="d-flex align-items-center mb-4">
                <button 
                  className="btn btn-link text-dark p-0 me-3" 
                  onClick={() => {
                    if (window.confirm('Save your progress before leaving?')) {
                      localStorage.setItem(`formData_${occ || 'draft'}`, JSON.stringify(formData));
                    }
                    navigate('/');
                  }}
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="card-title h3 mb-0">Video Recovery Notes</h1>
              </div>

              {/* Progress Indicator */}
              <div className="progress mb-4" style={{ height: '2px' }}>
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: 
                      activeSection === 'submission' ? '20%' :
                      activeSection === 'timing' ? '40%' :
                      activeSection === 'dvr' ? '60%' :
                      activeSection === 'cameras' ? '80%' :
                      '100%'
                  }}
                />
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* 1. Submission Information */}
                  {activeSection === 'submission' && (
                    <>
                      <div className="col-12">
                        <h4 className="mt-4">SUBMISSION INFORMATION</h4>
                      </div>

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

                      <div className="col-12">
                        <label htmlFor="address" className="form-label">Address:</label>
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

                      <div className="col-md-6">
                        <label htmlFor="locationContact" className="form-label">Location Contact:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="locationContact"
                          name="locationContact"
                          value={formData.locationContact}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="locationPhone" className="form-label">Location Phone Number:</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="locationPhone"
                          name="locationPhone"
                          value={formData.locationPhone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  )}

                  {/* 2. Timing Information */}
                  {activeSection === 'timing' && (
                    <>
                      <div className="col-12">
                        <h4 className="mt-4">TIMING INFORMATION</h4>
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="requestReceived" className="form-label">Request Received:</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="requestReceived"
                          name="requestReceived"
                          value={formData.requestReceived}
                          onChange={handleInputChange}
                          onFocus={() => handleTimeFieldFocus('requestReceived')}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="onSceneArrival" className="form-label">On-Scene Arrival:</label>
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
                        <label htmlFor="onSceneDeparture" className="form-label">On-Scene Departure:</label>
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

                      <div className="col-md-6">
                        <label htmlFor="extractFrom" className="form-label">Extract From:</label>
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
                        <label htmlFor="extractTo" className="form-label">Extract To:</label>
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

                      <div className="col-12">
                        <label htmlFor="timeType" className="form-label">Time Type:</label>
                        <select
                          className="form-select"
                          id="timeType"
                          name="timeType"
                          value={formData.timeType}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="actual_time">Actual Time</option>
                          <option value="corrected_time">Corrected Time</option>
                        </select>
                      </div>

                      {formData.timeType === 'corrected_time' && (
                        <>
                          <div className="col-md-6">
                            <label htmlFor="correctedDvrFrom" className="form-label">Corrected DVR From:</label>
                            <input
                              type="datetime-local"
                              className="form-control"
                              id="correctedDvrFrom"
                              name="correctedDvrFrom"
                              value={formData.correctedDvrFrom}
                              onChange={handleInputChange}
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label htmlFor="correctedDvrTo" className="form-label">Corrected DVR To:</label>
                            <input
                              type="datetime-local"
                              className="form-control"
                              id="correctedDvrTo"
                              name="correctedDvrTo"
                              value={formData.correctedDvrTo}
                              onChange={handleInputChange}
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label htmlFor="correctedRealFrom" className="form-label">Corrected Real From:</label>
                            <input
                              type="datetime-local"
                              className="form-control"
                              id="correctedRealFrom"
                              name="correctedRealFrom"
                              value={formData.correctedRealFrom}
                              onChange={handleInputChange}
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label htmlFor="correctedRealTo" className="form-label">Corrected Real To:</label>
                            <input
                              type="datetime-local"
                              className="form-control"
                              id="correctedRealTo"
                              name="correctedRealTo"
                              value={formData.correctedRealTo}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* 3. DVR Information */}
                  {activeSection === 'dvr' && (
                    <>
                      <div className="col-12">
                        <h4 className="mt-4">DVR INFORMATION</h4>
                      </div>

                      <div className="col-md-6 col-lg-4">
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

                      <div className="col-md-6 col-lg-4">
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

                      <div className="col-md-6 col-lg-4">
                        <label htmlFor="serialNumber" className="form-label">Serial Number:</label>
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

                      <div className="col-md-6 col-lg-3">
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

                      <div className="col-md-6 col-lg-3">
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

                      <div className="col-md-6">
                        <label htmlFor="dvrDatetime" className="form-label">DVR Date/Time:</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="dvrDatetime"
                          name="dvrDatetime"
                          value={formData.dvrDatetime}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="actualDatetime" className="form-label">Actual Date/Time:</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="actualDatetime"
                          name="actualDatetime"
                          value={formData.actualDatetime}
                          onChange={handleInputChange}
                          onFocus={() => handleTimeFieldFocus('actualDatetime')}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="username" className="form-label">Username:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="password" className="form-label">Password:</label>
                        <input
                          type="password"
                          className="form-control"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="recordingResolution" className="form-label">Recording Resolution:</label>
                        <select
                          className="form-select"
                          id="recordingResolution"
                          name="recordingResolution"
                          value={formData.recordingResolution}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Resolution</option>
                          <option value="1080p">1080p</option>
                          <option value="720p">720p</option>
                          <option value="4MP">4MP</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {formData.recordingResolution === 'custom' && (
                        <div className="col-md-6">
                          <label htmlFor="customResolution" className="form-label">Custom Resolution:</label>
                          <input
                            type="text"
                            className="form-control"
                            id="customResolution"
                            name="customResolution"
                            value={formData.customResolution}
                            onChange={handleInputChange}
                            placeholder="e.g., 1920x1080"
                          />
                        </div>
                      )}

                      <div className="col-md-6">
                        <label htmlFor="recordingFps" className="form-label">Recording FPS:</label>
                        <select
                          className="form-select"
                          id="recordingFps"
                          name="recordingFps"
                          value={formData.recordingFps}
                          onChange={handleInputChange}
                        >
                          <option value="">Select FPS</option>
                          <option value="30">30 FPS</option>
                          <option value="25">25 FPS</option>
                          <option value="15">15 FPS</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {formData.recordingFps === 'custom' && (
                        <div className="col-md-6">
                          <label htmlFor="customFps" className="form-label">Custom FPS:</label>
                          <input
                            type="number"
                            className="form-control"
                            id="customFps"
                            name="customFps"
                            value={formData.customFps}
                            onChange={handleInputChange}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* 4. Camera Information */}
                  {activeSection === 'cameras' && (
                    <>
                      <div className="col-12">
                        <h4 className="mt-4">CAMERA INFORMATION</h4>
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="useIndividualCameras"
                            name="useIndividualCameras"
                            checked={formData.useIndividualCameras}
                            onChange={(e) => {
                              handleInputChange({
                                target: {
                                  name: 'useIndividualCameras',
                                  value: e.target.checked
                                }
                              });
                            }}
                          />
                          <label className="form-check-label" htmlFor="useIndividualCameras">
                            Add Individual Camera Details
                          </label>
                        </div>
                      </div>

                      {formData.useIndividualCameras && (
                        <div className="col-12">
                          <button
                            type="button"
                            className="btn btn-outline-primary mb-3"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                cameras: [
                                  ...prev.cameras,
                                  {
                                    id: Date.now(),
                                    number: prev.cameras.length + 1,
                                    location: '',
                                    description: ''
                                  }
                                ]
                              }));
                            }}
                          >
                            Add Camera
                          </button>

                          {formData.cameras.map((camera, index) => (
                            <div key={camera.id} className="card mb-3">
                              <div className="card-body">
                                <h5 className="card-title">Camera {camera.number}</h5>
                                <div className="row g-3">
                                  <div className="col-md-6">
                                    <label className="form-label">Location:</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={camera.location}
                                      onChange={(e) => {
                                        const newCameras = [...formData.cameras];
                                        newCameras[index].location = e.target.value;
                                        handleInputChange({
                                          target: {
                                            name: 'cameras',
                                            value: newCameras
                                          }
                                        });
                                      }}
                                    />
                                  </div>
                                  <div className="col-md-6">
                                    <label className="form-label">Description:</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={camera.description}
                                      onChange={(e) => {
                                        const newCameras = [...formData.cameras];
                                        newCameras[index].description = e.target.value;
                                        handleInputChange({
                                          target: {
                                            name: 'cameras',
                                            value: newCameras
                                          }
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* 5. Export Information */}
                  {activeSection === 'export' && (
                    <>
                      <div className="col-12">
                        <h4 className="mt-4">EXPORT INFORMATION</h4>
                      </div>

                      <div className="col-md-6 col-lg-4">
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

                      <div className="col-md-6 col-lg-4">
                        <label htmlFor="mediaPlayer" className="form-label">Media Player Included:</label>
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

                      <div className="col-md-6 col-lg-4">
                        <label htmlFor="fileType" className="form-label">File Type:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="fileType"
                          name="fileType"
                          value={formData.fileType}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="sizeGb" className="form-label">Size (GB):</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          id="sizeGb"
                          name="sizeGb"
                          value={formData.sizeGb}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="mediaProvidedVia" className="form-label">Media Provided Via:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="mediaProvidedVia"
                          name="mediaProvidedVia"
                          value={formData.mediaProvidedVia}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="notes" className="form-label">Additional Notes:</label>
                        <textarea
                          className="form-control"
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows="3"
                        />
                      </div>

                      <div className="col-12">
                        <label htmlFor="completedBy" className="form-label">Completed By:</label>
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
                    </>
                  )}

                  {/* Navigation Buttons */}
                  <div className="col-12 d-flex justify-content-between mt-4">
                    {activeSection !== 'submission' && (
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => {
                          switch (activeSection) {
                            case 'timing':
                              setActiveSection('submission');
                              break;
                            case 'dvr':
                              setActiveSection('timing');
                              break;
                            case 'cameras':
                              setActiveSection('dvr');
                              break;
                            case 'export':
                              setActiveSection('cameras');
                              break;
                            default:
                              break;
                          }
                        }}
                      >
                        Previous
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary ms-auto"
                      onClick={handleSaveAndContinue}
                    >
                      {activeSection === 'export' ? 'Save and Finish' : 'Save and Continue'}
                    </button>
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

export default CaseForm; 