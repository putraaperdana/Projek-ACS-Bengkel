import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Customers() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    window.electron.ipcRenderer.invoke('customers:list').then((r) => setRows(r))
  }, [])
  return (
    <div className="page-shell">
      <section className="table-card">
        <div className="dashboard-header">
          <h2>Customers</h2>
          <Link className="link-muted" to="/dashboard">
            Kembali ke Dashboard
          </Link>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Vehicle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.full_name}</td>
                  <td>{r.phone || ''}</td>
                  <td>{r.vehicle_plate || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
