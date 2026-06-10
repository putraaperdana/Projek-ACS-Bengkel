import React, { useEffect, useState } from 'react'

export default function WorkOrders() {
  const [parts, setParts] = useState([])
  const [customers, setCustomers] = useState([])
  const [selectedParts, setSelectedParts] = useState([])
  const [customerId, setCustomerId] = useState('')

  useEffect(() => {
    window.electron.ipcRenderer.invoke('parts:list').then((r) => setParts(r))
    window.electron.ipcRenderer.invoke('customers:list').then((r) => setCustomers(r))
  }, [])

  const addPart = (partId) => {
    const p = parts.find((x) => x.id == partId)
    if (!p) return
    const existing = selectedParts.find((x) => x.part_id == p.id)
    if (existing) existing.quantity += 1
    else selectedParts.push({ part_id: p.id, quantity: 1 })
    setSelectedParts([...selectedParts])
  }

  const create = async () => {
    if (!customerId) return alert('Pilih customer')
    const res = await window.electron.ipcRenderer.invoke(
      'workorders:create',
      Number(customerId),
      null,
      JSON.stringify(selectedParts)
    )
    if (res && res.id) alert('Work order created: ' + res.id)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Work Orders</h2>
      <div>
        <label>Customer</label>
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">--select--</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} ({c.vehicle_plate || ''})
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: 10 }}>
        <h4>Parts</h4>
        <ul>
          {parts.map((p) => (
            <li key={p.id}>
              {p.name} ({p.stock_qty}) <button onClick={() => addPart(p.id)}>Add</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4>Selected</h4>
        <ul>
          {selectedParts.map((s, i) => (
            <li key={i}>
              Part {s.part_id} - Qty: {s.quantity}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={create}>Create Work Order</button>
    </div>
  )
}
