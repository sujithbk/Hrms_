import { Button } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
export const AuthButton = ({ onClick, sx, children, disabled, size ,}) => {
  return (
    <Button
      sx={{ ...sx, backgroundColor: "#006EB3", color: "#edf5f8ff" }}
      onClick={onClick}   // ✅ now consistent with MUI
      autoFocus={false}
      disabled={disabled}
      size={size}
      variant="contained"
    >
      {children}
    </Button>
  );
};

export const ButtonIcon = ({onClick,sx, children  ,disabled})=>{
    return(
        <Button
         variant="outlined"
            startIcon={<GoogleIcon />}
            sx={{ textTransform: "none" }}
            fullWidth
            onClick={onClick}
            autoFocus={false}
            disabled={disabled}
        >
            {children}
        </Button>
    )
}
