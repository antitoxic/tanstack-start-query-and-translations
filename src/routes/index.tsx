import { createFileRoute } from '@tanstack/react-router'
import { Card } from '~/components/Card';
import { Loader } from '~/components/Loader';

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-2">
      <h3>Welcome Home!!!</h3>
      <Card/>
      <Loader/>
    </div>
  )
}
