import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createRole, resetState } from "../../../../redux/features/adminRoleCreationSlice";
import { Box, Button, TextField, Typography, CircularProgress, Alert } from "@mui/material";

const RoleCreation = () => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.admin);

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (success) {
      setRoleName("");
      setDescription("");
      // Optionally reset the state after success
      setTimeout(() => dispatch(resetState()), 3000);
    }
  }, [success, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createRole({ role_name: roleName, description }));
  };

  return (
    <Box maxWidth={400} mx="auto" mt={5}>
      <Typography variant="h5" mb={2} align="center">
        Create New Role
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Role Name"
          fullWidth
          margin="normal"
          required
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          disabled={loading}
        />
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          required
          multiline
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Role created successfully!
          </Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Create Role
        </Button>
      </form>
    </Box>
  );
};

export default RoleCreation;
