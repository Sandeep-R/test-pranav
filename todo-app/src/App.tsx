import { useState } from 'react'
import { Plus, Trash2, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')

  const addTodo = () => {
    if (newTodo.trim() === '') return
    
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date()
    }
    
    setTodos([todo, ...todos])
    setNewTodo('')
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  const completedCount = todos.filter(t => t.completed).length
  const totalCount = todos.length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary rounded-lg">
              <ListTodo className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Todo List
            </h1>
          </div>
          <p className="text-muted-foreground">
            Stay organized and get things done
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Your Tasks</CardTitle>
                <CardDescription>
                  {totalCount === 0
                    ? "No tasks yet. Add one below!"
                    : `${completedCount} of ${totalCount} completed`}
                </CardDescription>
              </div>
              {totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {Math.round((completedCount / totalCount) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Add Todo Input */}
            <div className="flex gap-3">
              <Input
                placeholder="What needs to be done?"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={addTodo} disabled={!newTodo.trim()}>
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

            {/* Todo List */}
            <div className="space-y-2 mt-6">
              {todos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Your todo list is empty</p>
                  <p className="text-sm">Add a task to get started</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "group flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-200",
                      todo.completed && "opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="shrink-0"
                    />
                    
                    <span
                      className={cn(
                        "flex-1 text-foreground transition-all duration-200",
                        todo.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {todo.text}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Clear completed button */}
            {completedCount > 0 && (
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTodos(todos.filter(t => !t.completed))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear {completedCount} completed {completedCount === 1 ? 'task' : 'tasks'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Built with React, Tailwind CSS & shadcn/ui
        </p>
      </div>
    </div>
  )
}

export default App
