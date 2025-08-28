import React from 'react'
import Navbar from './Navbar/Navbar'
import AdminUsers from './body/AdminUsers'
import RoleCreation from './body/RoleCreation'


function AdminDash() {
  return (
<>
  <Navbar/>
  <RoleCreation/>
  <AdminUsers/>
</>
  )
}

export default AdminDash