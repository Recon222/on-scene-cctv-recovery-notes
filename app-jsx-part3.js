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