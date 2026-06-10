import React, { useEffect, useState } from 'react'

export default function Mechanics() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    window.electron.ipcRenderer.invoke('mechanics:list').then((r) => setRows(r))
  }, [])
  return (
    <div style={{ padding: 20 }}>
      <h2>Mechanics</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Name</th>
            <th>Skill</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.username}</td>
              <td>{r.full_name}</td>
              <td>{r.skill}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
