// frontend/src/components/ArchiveBoard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getArchivedTasksForUser } from '../api/tasks';
import TaskCard                   from './TaskCard';
import { getTaskColor }           from '../utils/getTaskColor';

export default function ArchiveBoard({ filterUser, currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [now, setNow]     = useState(new Date());
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [dateFilter, setDateFilter]     = useState('');

  const fetchArchive = useCallback(() => {
    const uid = filterUser?.user_id || currentUser.user_id;
    getArchivedTasksForUser(uid).then(setTasks).catch(console.error);
  }, [filterUser, currentUser.user_id]);

  useEffect(() => {
    fetchArchive();
    let tId, iId;
    const align = () => {
      const s   = new Date().getSeconds();
      const d   = s<1?(1-s)*1000:s<31?(31-s)*1000:(61-s)*1000;
      tId = setTimeout(()=>{
        setNow(new Date());
        fetchArchive();
        iId = setInterval(()=>{
          setNow(new Date());
          fetchArchive();
        }, 30000);
      }, d);
    };
    align();
    return ()=>{ clearTimeout(tId); clearInterval(iId); };
  }, [fetchArchive]);

  let arch = tasks.map(t => ({
    ...t,
    wasExpired: new Date(t.deadline) < now
  }));

  if (statusFilter) {
    arch = arch.filter(t=>{
      if (statusFilter==='Complete')   return t.status==='completed'&&!t.wasExpired;
      if (statusFilter==='Late')       return t.status==='completed'&&t.wasExpired;
      if (statusFilter==='Incomplete') return t.status!=='completed';
      return true;
    });
  }
  if (typeFilter) {
    arch = arch.filter(t=>getTaskColor(t.importance,t.urgency)===typeFilter);
  }
  if (dateFilter) {
    arch = arch.filter(t=>
      new Date(t.deadline).toLocaleDateString() ===
      new Date(dateFilter).toLocaleDateString()
    );
  }
  if (search) {
    arch = arch.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  const grouped = arch.reduce((acc,t)=>{
    const key = new Date(t.deadline).toLocaleDateString();
    (acc[key]=acc[key]||[]).push(t);
    return acc;
  }, {});

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      <h3 style={{ padding:'0 1rem' }}>Archive</h3>

      <div style={{ display:'flex',gap:'1rem',padding:'0 1rem',margin:'0.5rem 0' }}>
        <div>
          <label>Search</label>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{ padding:'0.5rem',margin:'0.25rem 0' }}
          />
        </div>
        <div>
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={e=>setStatusFilter(e.target.value)}
            style={{ padding:'0.5rem' }}
          >
            <option value="">All</option>
            <option value="Complete">Complete</option>
            <option value="Late">Late</option>
            <option value="Incomplete">Incomplete</option>
          </select>
        </div>
        <div>
          <label>Type</label>
          <select
            value={typeFilter}
            onChange={e=>setTypeFilter(e.target.value)}
            style={{ padding:'0.5rem' }}
          >
            <option value="">All</option>
            <option value="do">Do</option>
            <option value="schedule">Schedule</option>
            <option value="delegate">Delegate</option>
            <option value="eliminate">Eliminate</option>
          </select>
        </div>
        <div>
          <label>Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e=>setDateFilter(e.target.value)}
            style={{ padding:'0.5rem' }}
          />
        </div>
        <button onClick={()=>{setSearch('');setStatusFilter('');setTypeFilter('');setDateFilter('')}}>
          Clear
        </button>
      </div>

      <div style={{ flex:1,overflowY:'auto',padding:'0 1rem' }}>
        {Object.entries(grouped).map(([date, items])=>(
          <div key={date}>
            <h4 style={{ margin:'1rem 0 0.5rem' }}>{date}</h4>
            {items.map(t=>(
              <TaskCard
                key={t.task_id}
                task={t}
                isArchived
                wasExpired={t.wasExpired}
                onStatusChange={fetchArchive}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
