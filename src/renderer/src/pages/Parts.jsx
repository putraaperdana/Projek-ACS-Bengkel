import React, { useEffect, useState } from 'react'

export default function Parts(){
  const [rows, setRows] = useState([])
  useEffect(()=>{
    window.electron.ipcRenderer.invoke('parts:list').then(r=>setRows(r))
  },[])
  return (
    <div style={{padding:20}}>
      <h2>Parts</h2>
      <table border={1} cellPadding={6}>
        <thead><tr><th>ID</th><th>SKU</th><th>Name</th><th>Price</th><th>Stock</th></tr></thead>
        <tbody>
          {rows.map(r=> <tr key={r.id}><td>{r.id}</td><td>{r.sku}</td><td>{r.name}</td><td>{r.unit_price}</td><td>{r.stock_qty}</td></tr>)}
        </tbody>
      </table>
    </div>
  )
}
