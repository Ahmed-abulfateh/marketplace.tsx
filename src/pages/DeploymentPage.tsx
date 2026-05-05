import { useEffect, useState } from 'react'

interface DeploymentStatus {
  status: 'connecting' | 'connected' | 'error'
  message: string
  mongoDBStatus: string
  apiHealth: string
  timestamp: string
}

function DeploymentPage() {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    status: 'connecting',
    message: 'Checking deployment status...',
    mongoDBStatus: 'Checking...',
    apiHealth: 'Checking...',
    timestamp: new Date().toLocaleString(),
  })

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const checkDeploymentStatus = async () => {
      const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
      if (!API_BASE) {
        if (isMounted) {
          setDeploymentStatus({
            status: 'error',
            message: 'No backend URL configured (VITE_API_URL is not set)',
            mongoDBStatus: 'Unknown',
            apiHealth: 'Not configured',
            timestamp: new Date().toLocaleString(),
          })
        }
        return
      }
      try {
        const healthResponse = await fetch(`${API_BASE}/api/health`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!isMounted) return

        if (healthResponse.ok) {
          setDeploymentStatus({
            status: 'connected',
            message: 'Deployment is operational',
            mongoDBStatus: 'Connected',
            apiHealth: 'Healthy',
            timestamp: new Date().toLocaleString(),
          })
        } else {
          setDeploymentStatus({
            status: 'error',
            message: `API responded with status ${healthResponse.status}`,
            mongoDBStatus: 'Unknown',
            apiHealth: 'Unhealthy',
            timestamp: new Date().toLocaleString(),
          })
        }
      } catch (error) {
        if (!isMounted) return

        const errorMsg =
          error instanceof Error
            ? error.name === 'AbortError'
              ? 'Request timed out'
              : error.message
            : 'Unknown error'

        setDeploymentStatus({
          status: 'error',
          message: `Failed to connect to API: ${errorMsg}`,
          mongoDBStatus: 'Unknown',
          apiHealth: 'Unreachable',
          timestamp: new Date().toLocaleString(),
        })
      }

      clearTimeout(timeoutId)
    }

    checkDeploymentStatus()
    const interval = setInterval(checkDeploymentStatus, 10000) // Check every 10 seconds

    return () => {
      isMounted = false
      clearInterval(interval)
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Deployment Status</h1>

      <section
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          borderRadius: '8px',
          backgroundColor:
            deploymentStatus.status === 'connected'
              ? '#d4edda'
              : deploymentStatus.status === 'error'
                ? '#f8d7da'
                : '#e2e3e5',
          borderLeft: `4px solid ${
            deploymentStatus.status === 'connected'
              ? '#28a745'
              : deploymentStatus.status === 'error'
                ? '#dc3545'
                : '#6c757d'
          }`,
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
          {deploymentStatus.status === 'connected' ? '✓' : deploymentStatus.status === 'error' ? '✕' : '⟳'} Overall
          Status
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '500' }}>{deploymentStatus.message}</p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>Last checked: {deploymentStatus.timestamp}</p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Service Details</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}
        >
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '6px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>MongoDB</h3>
            <p
              style={{
                margin: 0,
                padding: '0.5rem 0',
                color: deploymentStatus.mongoDBStatus === 'Connected' ? '#28a745' : '#dc3545',
                fontWeight: '500',
              }}
            >
              {deploymentStatus.mongoDBStatus}
            </p>
          </div>

          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '6px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>API Server</h3>
            <p
              style={{
                margin: 0,
                padding: '0.5rem 0',
                color: deploymentStatus.apiHealth === 'Healthy' ? '#28a745' : '#dc3545',
                fontWeight: '500',
              }}
            >
              {deploymentStatus.apiHealth}
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Configuration</h2>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
          <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
            <strong>API Endpoint:</strong> <code>/api</code>
          </p>
          <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
            <strong>Database:</strong> MongoDB Atlas (MarketPlace)
          </p>
          <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
            <strong>Status Page URL:</strong> <code>/deployment</code>
          </p>
        </div>
      </section>
    </main>
  )
}

export default DeploymentPage
