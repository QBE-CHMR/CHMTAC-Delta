import axios from 'axios';
import { STATUS_ENUM } from '../common/constants/statusEnum.js';

// Configuration values - should be environment variables in production
const DMZ_DAL_URL = `http://chmr-dmz-dal:${process.env.PORT_DMZ_DAL || 5000}`;
const DMP_INGEST_URL = process.env.DMP_INGEST_URL || `http://chmr-dmp-ingest:${process.env.PORT_DMP_INGEST || 7642}/api/ingest`;
const POLL_INTERVAL = process.env.POLL_INTERVAL || 6000; // Default is 6 seconds

// Fetches all promotable reports from DMZ DAL
async function fetchPromotableReports() {
  try {
    const response = await axios.get(`${DMZ_DAL_URL}/report/management`, {
      params: { status: STATUS_ENUM.PROMOTABLE }
    });
    
    // Check if response.data is already an array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // If response.data has a reports property that's an array
    if (response.data && Array.isArray(response.data.reports)) {
      return response.data.reports;
    }
    
    // Default to empty array if we couldn't identify the structure
    console.warn('Could not determine report structure in response:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching promotable reports:', error.message);
    return [];
  }
}

// Sends a report to DMP ingest service
async function sendReportToDMP(report) {
  try {
    await axios.post(DMP_INGEST_URL, report);
    console.log(`Successfully sent report ${report.id} to DMP ingest`);
    return true;
  } catch (error) {
    console.error(`Error sending report ${report.id} to DMP:`, error.message);
    return false;
  }
}

// Updates report status in DMZ DAL
async function updateReportStatus(reportId, status) {
  try {
    await axios.patch(`${DMZ_DAL_URL}/report/management/${reportId}`, { 
      status 
    });
    console.log(`Updated report ${reportId} status to ${status}`);
    return true;
  } catch (error) {
    console.error(`Error updating report ${reportId} status:`, error.message);
    return false;
  }
}

// Main process function
async function processPromotableReports() {
  console.log('Checking for promotable reports...');
  
  const reports = await fetchPromotableReports();
  console.log(`Found ${reports.length} promotable reports`);
  
  for (const report of reports) {
    console.log(`Processing report ${report.id}`);
    
    const success = await sendReportToDMP(report);
    
    if (success) {
      // Update status to ARCHIVE after successful promotion
      await updateReportStatus(report.id, STATUS_ENUM.ARCHIVE);
    }
  }
}

// Start the process to continuously check for and process promotable reports
function startProcessing() {
  console.log('Starting report disposition service');
  
  // Run immediately on startup
  processPromotableReports();
  
  // Then run on the defined interval
  setInterval(processPromotableReports, POLL_INTERVAL);
}

// Start the service
startProcessing();