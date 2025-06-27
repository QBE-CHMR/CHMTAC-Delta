/**
 * Checks for Honeypot fields 
 */
export default (req, res, next) => {
  const fieldOperationLocation = typeof req.body.field_operation_location === "string" ? req.body.field_operation_location : "";
  const incidentSeverity = typeof req.body.incident_severity === "string" ? req.body.incident_severity : "";  
    
  if ((fieldOperationLocation && fieldOperationLocation.trim() !== '') || (incidentSeverity && incidentSeverity.trim() !== '')) {
    console.log("Honeypot triggered. Ignoring submission.");
    console.log("field_operation_location hpot:", fieldOperationLocation, ", incident_severity hpot:", incidentSeverity);
    return res.status(200).json({ message: "Form submitted successfully!" }); // Simulate success
  }
  
  next();
};