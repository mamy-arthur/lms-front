import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const onlineStudents = [
  {
    id: 1,
    name: 'John Doe',
    avatar: '',
  },
  {
    id: 2,
    name: 'Jane Smith',
    avatar: '',
  },
  {
    id: 3,
    name: 'Alex Martin',
    avatar: '',
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    avatar: '',
  },
];

export function OnlineStudentsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Étudiants en ligne</CardTitle>
          <span>(4)</span>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-3">
        {onlineStudents.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between rounded-lg bg-gray-100 p-2"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={student.avatar} />
                <AvatarFallback className="text-xs">
                  {student.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>

              <span className="text-xs font-medium">{student.name}</span>
            </div>

            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
