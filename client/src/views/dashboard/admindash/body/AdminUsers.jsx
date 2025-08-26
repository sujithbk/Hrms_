import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../../../redux/features/adminSlice";
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper 
} from "@mui/material";

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  if (loading) return <CircularProgress />;

  if (error) {
    return (
      <Alert severity="error" sx={{ width: "100%" }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" mb={2}>
        Users List
      </Typography>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users?.map((user, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  {user.name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};


export default AdminUsers