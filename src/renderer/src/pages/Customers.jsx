import React, { useEffect, useState } from 'react'

export default function Customers(){
  const [rows, setRows] = useState([])
  useEffect(()=>{
    window.electron.ipcRenderer.invoke('customers:list').then(r=>setRows(r))
  },[])
  return (
    <div style={{padding:20}}>
      <h2>Customers</h2>
      <table border={1} cellPadding={6}>
        <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Vehicle</th></tr></thead>
        <tbody>
          {rows.map(r=> <tr key={r.id}><td>{r.id}</td><td>{r.full_name}</td><td>{r.phone || ''}</td><td>{r.vehicle_plate || ''}</td></tr>)}
        </tbody>
      </table>
    </div>
  )
}
