import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, MessageCircle, Plus, GripVertical, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { AnthropicMessage } from "@/types/anthropic";

interface MessageBuilderProps {
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  messages: AnthropicMessage[];
  onMessagesChange: (messages: AnthropicMessage[]) => void;
}

export default function MessageBuilder({
  systemPrompt,
  onSystemPromptChange,
  messages,
  onMessagesChange
}: MessageBuilderProps) {
  
  const addMessage = () => {
    onMessagesChange([...messages, { role: "user", content: "" }]);
  };

  const updateMessage = (index: number, updates: Partial<AnthropicMessage>) => {
    const updated = messages.map((msg, i) => 
      i === index ? { ...msg, ...updates } : msg
    );
    onMessagesChange(updated);
  };

  const deleteMessage = (index: number) => {
    if (messages.length > 1) {
      onMessagesChange(messages.filter((_, i) => i !== index));
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reordered = Array.from(messages);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    onMessagesChange(reordered);
  };

  const getMessageBgClass = (role: string) => {
    return role === "user" ? "bg-muted/50" : "bg-accent/10";
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* System Prompt */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-2 mb-3">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">System Prompt</h3>
          </div>
          <Textarea
            placeholder="Enter system prompt instructions here..."
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            rows={3}
            data-testid="textarea-system-prompt"
          />
        </div>

        {/* Messages */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Messages</h3>
            </div>
            <Button onClick={addMessage} data-testid="button-add-message">
              <Plus className="h-4 w-4 mr-2" />
              Add Message
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="messages">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {messages.map((message, index) => (
                    <Draggable
                      key={index}
                      draggableId={`message-${index}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${getMessageBgClass(message.role)} rounded-lg p-4 border border-border ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                          data-testid={`message-${index}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Select
                                value={message.role}
                                onValueChange={(role: "user" | "assistant") => 
                                  updateMessage(index, { role })
                                }
                                data-testid={`select-role-${index}`}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="assistant">Assistant</SelectItem>
                                </SelectContent>
                              </Select>
                              <Badge variant="outline">Message {index + 1}</Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div
                                {...provided.dragHandleProps}
                                className="p-1 text-muted-foreground hover:text-foreground cursor-grab"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMessage(index)}
                                disabled={messages.length === 1}
                                data-testid={`button-delete-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex space-x-2 mb-2">
                              <Badge variant="default">Text</Badge>
                              <Badge variant="secondary">Image</Badge>
                            </div>
                          </div>
                          
                          <Textarea
                            placeholder="Enter message content..."
                            value={typeof message.content === 'string' ? message.content : ''}
                            onChange={(e) => updateMessage(index, { content: e.target.value })}
                            rows={4}
                            data-testid={`textarea-content-${index}`}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </CardContent>
    </Card>
  );
}
