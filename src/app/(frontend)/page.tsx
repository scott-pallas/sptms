import React from 'react'
import Link from 'next/link'

export default async function Page() {
  return (
    <div className="home">
      <div className="content">
        <h1>SPTMS</h1>
        <p>Welcome to your new project</p>
      </div>
      <div className="links">
        <Link href="/admin" className="admin">
          Admin Panel
        </Link>
      </div>
    </div>
  )
}
