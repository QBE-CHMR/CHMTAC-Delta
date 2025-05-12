import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Alert,
  MenuItem,
  Stack
} from "@mui/material";
import CaptchaComponent from "./CaptchaComponent.js";
import DodContactInfoCard from "./DodContactInfoCard.js";
import CivilianContactInfoCard from "./CivilianContactInfoCard.js";
import FileUploadComponent from "./FileUploadComponent.js";
import moment from "moment-timezone";

// Choose between DOD or CIVILIAN form
const CHIR_CONTACT_TYPE = process.env.CHIR_CONTACT_TYPE || "DOD"; // Default to "DOD"

const IntakeFormComponent = ({ onSubmit }) => {
  const formRef = useRef(null); // Create a ref for the form element
  const [captchaVerified, setCaptchaVerified] = useState(true); // Set to true for testing
  const [error, setError] = useState("");
  const [location, setLocation] = useState('');

  const [selectedTimeZone, setSelectedTimeZone] = useState('');
  const timeZoneOptions = moment.tz.names(); // Get a list of all time zones

  useEffect(() => {
    // Dynamically add the honeypot field to the form
    if (formRef.current) {
      const honeypot2Field = document.createElement("input");
      honeypot2Field.type = "text";
      honeypot2Field.name = "honeypot2"; // Dynamic honeypot field
      honeypot2Field.style.position = "absolute"; // Move off-screen
      honeypot2Field.style.left = "-9999px"; // Position it far to the left
      honeypot2Field.style.top = "0"; // Keep it aligned vertically
      honeypot2Field.tabIndex = "-1"; // Exclude from tab navigation
      honeypot2Field.autocomplete = "off"; // Prevent autofill
      honeypot2Field.value = ""; // Ensure it's empty
      formRef.current.appendChild(honeypot2Field); // Append to the form using the ref
    }
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`Lat: ${latitude}, Long: ${longitude}`); // Update state
      });
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleReset = () => {
    if (formRef.current) {
      formRef.current.reset(); // Reset all form fields to their initial values
    }
    setError("");
    setCaptchaVerified(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(formRef.current);
    console.log("Files count:", formData.getAll('document_files').length);
  
    console.log("Submitting form data (multipart):", [...formData.keys()],[...formData.values()]);

    const startDateValue = formData.get("start_datetime"); // Retrieve start date
    const endDateValue = formData.get("end_datetime"); // Retrieve end date
    const now = new Date(); // Current date and time

    // Validate start date (required field)
    const startDate = new Date(startDateValue);
    if (startDate > now) {
      setError("Start date cannot be in the future.");
      return;
    }

    // Validate end date (optional field)
    if (endDateValue) {
      const endDate = new Date(endDateValue);

      if (endDate > now) {
        setError("End date cannot be in the future.");
        return;
      }

      if (endDate <= startDate) {
        setError("Incident end time must be later than start time.");
        return;
      }
    }

    if (!captchaVerified) {
      setError("Please complete the CAPTCHA before submitting.");
      return;
    }

    try {
      //await onSubmit(jsonData); // Pass the form data to the parent component
      await onSubmit(formData);
    } catch (err) {
      console.error("Error submitting the form:", err);
      setError("An error occurred while submitting the form. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} encType="multipart/form-data" sx={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>

      {/* Displays Contacts Card based on .env file*/}
      {CHIR_CONTACT_TYPE === "DOD" ? (
        <DodContactInfoCard />
      ) : (
        <CivilianContactInfoCard />
      )}

      {/* Additional Contacts Card */}
      <Card sx={{ mb: 5 }}>
        <CardHeader title="POC Contact Information" />
        <CardContent>
            <Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="POC 1 Name"
                    name="poc_1_name"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="POC 1 Info"
                    name="poc_1_info"
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Box sx={{ borderBottom: "1px solid #ccc", my: 2, width: '100%' }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="POC 2 Name"
                    name="poc_2_name"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="POC 2 Info"
                    name="poc_2_info"
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 5 }}>
        <CardHeader title="Where might civilian harm have occurred?" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Coordinates/Location"
                name="location"
                value={location} // Controlled input
                onChange={(e) => setLocation(e.target.value)} // Allow manual input
                fullWidth
                required
                InputLabelProps={{
                  shrink: true, // Ensure the label shrinks when the field has a value
                }}
              />
              <Button variant="contained" sx={{ mt: 2, backgroundColor: "#3f51b5" }} onClick={getLocation}>Get Location</Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField type="datetime-local" label="Start Date and Time" name="start_datetime" fullWidth required InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField type="datetime-local" label="End Date and Time" name="end_datetime" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Time Zone"
                name="time_zone"
                fullWidth
                required
                value={selectedTimeZone || ''} // Ensure the value is always a string
                onChange={(e) => setSelectedTimeZone(e.target.value)} // Update the selected time zone
              >
                {timeZoneOptions.map((zone) => (
                  <MenuItem key={zone} value={zone}>
                    {zone}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 5 }}>
        <CardHeader title="What happened?" />
        <CardContent>
          <TextField label="Describe all civilian harm you suspect" name="total_harm" fullWidth required multiline rows={3} sx={{ mb: 3 }} />
          <TextField label="What might have involved the U.S. military?" name="us_harm" fullWidth required multiline rows={3} />
        </CardContent>
      </Card>

      <Card sx={{ mb: 5 }}>
        <CardHeader title="External Information Sources" />
        <CardContent>
          {/* File Upload Input */}
          <Grid spacing={3} direction="column" >
            <Grid item xs={12}>
              <label>Upload External Information Sources</label>
              <FileUploadComponent />
            </Grid>
            <Grid item xs={12}>
              <TextField
                type="url"
                label="Provide a URL link to documentation"
                name="information_url"
                fullWidth
                sx={{ mt: 3 }} // Add spacing here
              />
            </Grid>
            <input
              type="text"
              name="honeypot1"
              tabIndex="-1"
              autoComplete="off"
              style={{
                position: "absolute",
                left: "-9999px",
                top: "0",
              }}
            />
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Submit and reset buttons stacked */}
      <Grid container spacing={2} justifyContent="space-between" alignItems="center">
        <Grid item xs={12} md={6}>
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 2, backgroundColor: "#3f51b5" }}
            fullWidth
          >
            Submit Form
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ mt: 3, mb: 3 }}
            type="reset"
            onClick={handleReset}
          >
            Reset Form
          </Button>
        </Grid>

        {/* Position Captcha in the same row */}
        <Grid item xs={12} md={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 3 }}>
            <CaptchaComponent onVerify={(verified) => setCaptchaVerified(verified)} />
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default IntakeFormComponent;
