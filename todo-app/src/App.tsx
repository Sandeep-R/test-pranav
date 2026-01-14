import { useState, useEffect } from 'react'
import { Plus, Trash2, ListTodo, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthModal } from './components/auth/AuthModal'
import { supabase, hasSupabaseConfig } from './lib/supabase'
import type { Todo as TodoType } from './types/database'

type TodoStatus = 'todo' | 'in-progress' | 'done'

const statusOptions: { value: TodoStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'done', label: 'Done', color: 'bg-green-500' },
]

function TodoApp() {
  const { user, signOut } = useAuth()
  const [todos, setTodos] = useState<TodoType[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [newTodoStatus, setNewTodoStatus] = useState<TodoStatus>('todo')
  const [loading, setLoading] = useState(true)

  // Fetch todos from Supabase
  useEffect(() => {
    if (!user) return

    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching todos:', error)
      } else {
        setTodos(data || [])
      }
      setLoading(false)
    }

    fetchTodos()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTodos((current) => {
              // Check if todo already exists (from optimistic update)
              const exists = current.some((todo) => todo.id === payload.new.id)
              if (exists) return current
              return [payload.new as TodoType, ...current]
            })
          } else if (payload.eventType === 'UPDATE') {
            setTodos((current) =>
              current.map((todo) =>
                todo.id === payload.new.id ? (payload.new as TodoType) : todo
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTodos((current) =>
              current.filter((todo) => todo.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const addTodo = async () => {
    if (newTodo.trim() === '' || !user) return

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        text: newTodo.trim(),
        completed: false,
        status: newTodoStatus,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding todo:', error)
    } else {
      // Optimistically add to UI immediately
      setTodos((current) => [data, ...current])
      setNewTodo('')
      setNewTodoStatus('todo')
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    // Optimistically update UI
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      )
    )

    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id)

    if (error) {
      console.error('Error toggling todo:', error)
      // Revert on error
      setTodos((current) =>
        current.map((todo) =>
          todo.id === id ? { ...todo, completed } : todo
        )
      )
    }
  }

  const updateTodoStatus = async (id: string, status: TodoStatus) => {
    // Store old status for rollback
    const oldStatus = todos.find((t) => t.id === id)?.status

    // Optimistically update UI
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, status } : todo
      )
    )

    const { error } = await supabase
      .from('todos')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error updating todo status:', error)
      // Revert on error
      if (oldStatus) {
        setTodos((current) =>
          current.map((todo) =>
            todo.id === id ? { ...todo, status: oldStatus } : todo
          )
        )
      }
    }
  }

  const deleteTodo = async (id: string) => {
    // Store for rollback
    const deletedTodo = todos.find((t) => t.id === id)

    // Optimistically remove from UI
    setTodos((current) => current.filter((todo) => todo.id !== id))

    const { error } = await supabase.from('todos').delete().eq('id', id)

    if (error) {
      console.error('Error deleting todo:', error)
      // Revert on error
      if (deletedTodo) {
        setTodos((current) => [deletedTodo, ...current])
      }
    }
  }

  const clearCompleted = async () => {
    const completedTodos = todos.filter((t) => t.completed)
    const completedIds = completedTodos.map((t) => t.id)

    // Optimistically remove from UI
    setTodos((current) => current.filter((t) => !t.completed))

    const { error } = await supabase.from('todos').delete().in('id', completedIds)

    if (error) {
      console.error('Error clearing completed todos:', error)
      // Revert on error
      setTodos((current) => [...completedTodos, ...current])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  const completedCount = todos.filter((t) => t.completed).length
  const totalCount = todos.length

  const getStatusColor = (status: TodoStatus) => {
    return statusOptions.find((opt) => opt.value === status)?.color || 'bg-gray-500'
  }

  const getStatusLabel = (status: TodoStatus) => {
    return statusOptions.find((opt) => opt.value === status)?.label || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

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
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </Button>
          </div>
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
              <Select value={newTodoStatus} onValueChange={(value) => setNewTodoStatus(value as TodoStatus)}>
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", getStatusColor(newTodoStatus))} />
                    <SelectValue>{getStatusLabel(newTodoStatus)}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                      onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
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

                    <Select 
                      value={todo.status} 
                      onValueChange={(value) => updateTodoStatus(todo.id, value as TodoStatus)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", getStatusColor(todo.status))} />
                          <SelectValue>{getStatusLabel(todo.status)}</SelectValue>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", option.color)} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

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
                  onClick={clearCompleted}
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Configuration Error</CardTitle>
            <CardDescription>
              Supabase environment variables are not configured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please set the following environment variables in your deployment platform:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-4">
              <li><code className="bg-secondary px-2 py-1 rounded">VITE_SUPABASE_URL</code></li>
              <li><code className="bg-secondary px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Get these values from your Supabase project settings → API
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthModal />
  }

  return <TodoApp />
}

export default App
