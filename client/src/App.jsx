import React from 'react'

import { BrowserRouter,Route,Routes } from "react-router-dom";
import AppRoutes from './routes';



function App() {
  return (
    <>
    <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
    </>
  )
}

export default App