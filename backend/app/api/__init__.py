from . import auth, users_prisma, teachers_prisma, students_prisma, parents_prisma, classes_prisma, events_prisma, messages_prisma, websockets, results_prisma
from . import webhook

# Re-export for easier importing in main
auth = auth
users = users_prisma
teachers = teachers_prisma
students = students_prisma
parents = parents_prisma
classes = classes_prisma
events = events_prisma
messages = messages_prisma
results = results_prisma
websockets = websockets
webhook = webhook