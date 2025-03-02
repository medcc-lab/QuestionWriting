#!/usr/bin/env python3

import os
import sys
import json
import time
import random
import hashlib
import requests
import subprocess
from datetime import datetime, timedelta
from pprint import pprint

# Configuration
BASE_URL = "http://localhost:3000/api"
WORKSPACE_DIR = "/workspaces/QuestionWritingWebApp"
MONGO_DB = "mcq-writing-app"

# Demo users data
# Faculty: Professor Smith / Email: smith@example.com / Password: faculty123
# Faculty: Dr. Johnson / Email: johnson@example.com / Password: faculty123
# Student: Alice Student / Email: alice@example.com / Password: student123
# Student: Bob Student / Email: bob@example.com / Password: student123
# Student: Charlie Student / Email: charlie@example.com / Password: student123
# Student: Diana Student / Email: diana@example.com / Password: student123
# Student: Ethan Student / Email: ethan@example.com / Password: student123

FACULTY_USERS = [
    {"name": "Professor Smith", "email": "smith@example.com", "password": "faculty123"},
    {"name": "Dr. Johnson", "email": "johnson@example.com", "password": "faculty123"}
]

STUDENT_USERS = [
    {"name": "Alice Student", "email": "alice@example.com", "password": "student123"},
    {"name": "Bob Student", "email": "bob@example.com", "password": "student123"},
    {"name": "Charlie Student", "email": "charlie@example.com", "password": "student123"},
    {"name": "Diana Student", "email": "diana@example.com", "password": "student123"},
    {"name": "Ethan Student", "email": "ethan@example.com", "password": "student123"},
]

# Demo lectures
LECTURES = [
    {
        "title": "Introduction to Computer Science",
        "description": "Fundamental concepts of programming and algorithm design"
    },
    {
        "title": "Data Structures and Algorithms",
        "description": "Advanced data structures and algorithm analysis"
    },
    {
        "title": "Database Systems",
        "description": "Relational databases, SQL, and data modeling"
    }
]

# Demo questions
QUESTION_TEMPLATES = [
    {
        "question": "What is the time complexity of the quicksort algorithm in the worst case?",
        "answers": [
            {"text": "O(n)", "isCorrect": False},
            {"text": "O(n log n)", "isCorrect": False},
            {"text": "O(n²)", "isCorrect": True},
            {"text": "O(n³)", "isCorrect": False}
        ]
    },
    {
        "question": "Which of the following is NOT a primary key constraint?",
        "answers": [
            {"text": "Must be unique", "isCorrect": False},
            {"text": "Can be null", "isCorrect": True},
            {"text": "Can consist of multiple columns", "isCorrect": False},
            {"text": "Must exist in every table", "isCorrect": False}
        ]
    },
    {
        "question": "What is encapsulation in object-oriented programming?",
        "answers": [
            {"text": "Bundling data and methods that operate on that data", "isCorrect": True},
            {"text": "Ability of a class to inherit from multiple parent classes", "isCorrect": False},
            {"text": "Ability to use a single interface for different underlying forms", "isCorrect": False},
            {"text": "Breaking down a complex problem into smaller parts", "isCorrect": False}
        ]
    },
    {
        "question": "Which data structure follows the LIFO principle?",
        "answers": [
            {"text": "Queue", "isCorrect": False},
            {"text": "Stack", "isCorrect": True},
            {"text": "Heap", "isCorrect": False},
            {"text": "Linked List", "isCorrect": False}
        ]
    },
    {
        "question": "What is the output of the following Python code?\n\nx = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)",
        "answers": [
            {"text": "[1, 2, 3]", "isCorrect": False},
            {"text": "[1, 2, 3, 4]", "isCorrect": True},
            {"text": "[4, 1, 2, 3]", "isCorrect": False},
            {"text": "Error", "isCorrect": False}
        ]
    },
    {
        "question": "Which SQL statement is used to retrieve data from a database?",
        "answers": [
            {"text": "GET", "isCorrect": False},
            {"text": "FETCH", "isCorrect": False},
            {"text": "SELECT", "isCorrect": True},
            {"text": "EXTRACT", "isCorrect": False}
        ]
    },
    {
        "question": "What does the acronym HTTP stand for?",
        "answers": [
            {"text": "Hyper Text Transfer Protocol", "isCorrect": True},
            {"text": "Hyper Transfer Text Protocol", "isCorrect": False},
            {"text": "High Text Transfer Protocol", "isCorrect": False},
            {"text": "Hyper Text Transport Protocol", "isCorrect": False}
        ]
    },
    {
        "question": "What is the purpose of the 'git clone' command?",
        "answers": [
            {"text": "To create a copy of a local repository", "isCorrect": False},
            {"text": "To create a copy of a remote repository", "isCorrect": True},
            {"text": "To merge branches in a repository", "isCorrect": False},
            {"text": "To push local changes to a remote repository", "isCorrect": False}
        ]
    },
    {
        "question": "Which of the following is not a JavaScript data type?",
        "answers": [
            {"text": "String", "isCorrect": False},
            {"text": "Boolean", "isCorrect": False},
            {"text": "Integer", "isCorrect": True},
            {"text": "Object", "isCorrect": False}
        ]
    },
    {
        "question": "In which programming language is 'print' used to output text to the console?",
        "answers": [
            {"text": "Java", "isCorrect": False},
            {"text": "Python", "isCorrect": True},
            {"text": "C++", "isCorrect": False},
            {"text": "JavaScript", "isCorrect": False}
        ]
    }
]

# Helper functions
def check_server_running():
    """Check if the API server is running"""
    try:
        response = requests.get(f"{BASE_URL}/users/profile", timeout=5)
        return True
    except requests.RequestException:
        return False

def validate_user_data(user_data):
    """Validate user data before sending to API"""
    required_fields = ["name", "email", "password", "role"]
    allowed_roles = ["student", "faculty"]
    
    # Check required fields
    for field in required_fields:
        if field not in user_data or not user_data[field]:
            raise ValueError(f"Missing required field: {field}")
    
    # Validate role
    if user_data["role"] not in allowed_roles:
        raise ValueError(f"Invalid role. Must be one of: {allowed_roles}")
    
    # Basic email validation
    if "@" not in user_data["email"]:
        raise ValueError("Invalid email format")
    
    return True

def register_user(user_data):
    """Register a new user and return the user info with token"""
    try:
        # Validate user data
        validate_user_data(user_data)
        
        print(f"Sending registration request for {user_data['email']}...")
        print(f"Request data: {json.dumps(user_data, indent=2)}")
        response = requests.post(f"{BASE_URL}/users/register", json=user_data)
        
        if not response.ok:
            print(f"Registration failed with status {response.status_code}")
            print(f"Response content: {response.text}")
            return None
            
        print(f"Successfully registered {user_data['email']}")
        return response.json()
    except ValueError as e:
        print(f"Validation error for {user_data.get('email', 'unknown')}: {str(e)}")
        return None
    except requests.RequestException as e:
        print(f"Error registering user: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response content: {e.response.text}")
        return None

def login_user(email, password):
    """Log in a user and return the token"""
    try:
        response = requests.post(f"{BASE_URL}/users/login", json={"email": email, "password": password})
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error logging in: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)
        return None

def create_lecture(token, lecture_data):
    """Create a new lecture"""
    try:
        response = requests.post(
            f"{BASE_URL}/lectures",
            json=lecture_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error creating lecture: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)
        return None

def create_question(token, question_data):
    """Create a new question"""
    try:
        response = requests.post(
            f"{BASE_URL}/questions",
            json=question_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error creating question: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)
        return None

def add_students_to_lecture(token, lecture_id, student_ids):
    """Add students to a lecture"""
    try:
        response = requests.post(
            f"{BASE_URL}/lectures/{lecture_id}/students",
            json={"studentIds": student_ids},
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error adding students to lecture: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)
        return None

def add_questions_to_lecture(token, lecture_id, question_ids):
    """Add questions to a lecture"""
    try:
        response = requests.post(
            f"{BASE_URL}/lectures/{lecture_id}/questions",
            json={"questionIds": question_ids},
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error adding questions to lecture: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)
        return None

def submit_edit_suggestion(token, question_id, suggestion_data):
    """Submit an edit suggestion for a question"""
    try:
        response = requests.post(
            f"{BASE_URL}/questions/{question_id}/suggestions",
            json=suggestion_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error submitting edit suggestion: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)
        return None

def handle_suggestion(token, question_id, suggestion_id, status, comment):
    """Accept or reject a suggestion"""
    try:
        response = requests.put(
            f"{BASE_URL}/questions/{question_id}/suggestions/{suggestion_id}",
            json={"status": status, "rebuttalComment": comment},
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error handling suggestion: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)
        return None

def submit_grades(token, question_id, grades_data):
    """Submit grades for a question"""
    try:
        response = requests.post(
            f"{BASE_URL}/questions/{question_id}/grades",
            json=grades_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error submitting grades: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)
        return None

def finalize_question(token, question_id):
    """Finalize a question"""
    try:
        response = requests.put(
            f"{BASE_URL}/questions/{question_id}/finalize",
            json={},
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error finalizing question: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)
        return None

def backup_database():
    """Create a backup of the current database state"""
    try:
        script_path = f"{WORKSPACE_DIR}/scripts/backup-db.sh"
        result = subprocess.run([script_path], check=True, capture_output=True, text=True)
        print(f"Database backup created: {result.stdout}")
        
        # Find the latest backup
        backups_dir = f"{WORKSPACE_DIR}/backups"
        backups = sorted([d for d in os.listdir(backups_dir) if os.path.isdir(os.path.join(backups_dir, d))], reverse=True)
        
        if backups:
            latest_backup = backups[0]
            new_name = f"demo-data_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            os.rename(os.path.join(backups_dir, latest_backup), os.path.join(backups_dir, new_name))
            print(f"Renamed backup to: {new_name}")
            return new_name
        else:
            print("No backup found")
            return None
        
    except subprocess.CalledProcessError as e:
        print(f"Error creating backup: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        return None

def main():
    """Main function to create demo data"""
    print("===== Starting Demo Data Creation =====")
    
    # Check if server is running
    if not check_server_running():
        print("Error: API server is not running. Please start the server with ./scripts/start-debug.sh")
        sys.exit(1)
    
    # Clear the database first
    print("Clearing database...")
    try:
        script_path = f"{WORKSPACE_DIR}/scripts/clear-db.sh"
        result = subprocess.run([script_path], check=True, capture_output=True, text=True)
        print("Database cleared successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error clearing database: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        sys.exit(1)
        
    # Create faculty users
    print("\nCreating faculty users...")
    faculty_tokens = []
    faculty_ids = []
    
    for user_data in FACULTY_USERS:
        user_data["role"] = "faculty"
        print(f"Registering {user_data['name']}...")
        user = register_user(user_data)
        if user:
            print(f"Created faculty: {user['name']} (ID: {user['_id']})")
            faculty_tokens.append(user["token"])
            faculty_ids.append(user["_id"])
        else:
            print(f"Failed to create faculty {user_data['name']}")
    
    if not faculty_tokens:
        print("Error: No faculty accounts were created. Exiting.")
        sys.exit(1)
    
    # Create student users
    print("\nCreating student users...")
    student_tokens = []
    student_ids = []
    
    for user_data in STUDENT_USERS:
        user_data["role"] = "student"
        print(f"Registering {user_data['name']}...")
        user = register_user(user_data)
        if user:
            print(f"Created student: {user['name']} (ID: {user['_id']})")
            student_tokens.append(user["token"])
            student_ids.append(user["_id"])
        else:
            print(f"Failed to create student {user_data['name']}")
    
    # Create lectures (using first faculty token)
    print("\nCreating lectures...")
    faculty_token = faculty_tokens[0]
    lectures = []
    
    for lecture_data in LECTURES:
        print(f"Creating lecture: {lecture_data['title']}...")
        lecture = create_lecture(faculty_token, lecture_data)
        if lecture:
            print(f"Created lecture: {lecture['title']} (ID: {lecture['_id']})")
            lectures.append(lecture)
        else:
            print(f"Failed to create lecture {lecture_data['title']}")
    
    # Add all students to the first lecture
    if lectures:
        print(f"\nAdding students to lecture: {lectures[0]['title']}")
        result = add_students_to_lecture(faculty_token, lectures[0]['_id'], student_ids)
        if result:
            print(f"Added {len(student_ids)} students to lecture")
        
        # Add a subset of students to the other lectures
        for i, lecture in enumerate(lectures[1:], 1):
            # Add alternating students to different lectures
            selected_students = student_ids[i-1::2]
            print(f"Adding {len(selected_students)} students to lecture: {lecture['title']}")
            result = add_students_to_lecture(faculty_token, lecture['_id'], selected_students)
            if result:
                print(f"Added {len(selected_students)} students to lecture")
    
    # Create questions (some by faculty, some by students)
    print("\nCreating questions...")
    all_questions = []
    
    # Faculty questions
    num_faculty_questions = min(6, len(QUESTION_TEMPLATES))
    for i in range(num_faculty_questions):
        template = QUESTION_TEMPLATES[i]
        print(f"Faculty creating question: {template['question'][:30]}...")
        question = create_question(faculty_token, template)
        if question:
            print(f"Created question ID: {question['_id']}")
            all_questions.append(question)
            
            # Finalize some questions
            if i % 2 == 0:
                print(f"Finalizing question ID: {question['_id']}")
                finalize_question(faculty_token, question['_id'])
    
    # Student questions
    remaining_templates = QUESTION_TEMPLATES[num_faculty_questions:]
    for i, template in enumerate(remaining_templates):
        student_token = student_tokens[i % len(student_tokens)]
        print(f"Student creating question: {template['question'][:30]}...")
        question = create_question(student_token, template)
        if question:
            print(f"Created question ID: {question['_id']}")
            all_questions.append(question)
    
    # Add questions to lectures
    if lectures and all_questions:
        print("\nAdding questions to lectures...")
        question_ids = [q['_id'] for q in all_questions]
        
        # Distribute questions among lectures
        for i, lecture in enumerate(lectures):
            # Each lecture gets a subset of questions with some overlap
            start_idx = i * (len(question_ids) // len(lectures))
            end_idx = min(start_idx + (len(question_ids) // len(lectures)) + 2, len(question_ids))
            lecture_questions = question_ids[start_idx:end_idx]
            
            print(f"Adding {len(lecture_questions)} questions to lecture: {lecture['title']}")
            result = add_questions_to_lecture(faculty_token, lecture['_id'], lecture_questions)
            if result:
                print(f"Added questions to lecture successfully")
    
    # Create some edit suggestions
    if all_questions:
        print("\nCreating edit suggestions...")
        for i, question in enumerate(all_questions[:4]):  # Only create suggestions for first few questions
            student_token = student_tokens[i % len(student_tokens)]
            
            # Create a modified version of the question
            original_question = question['question']
            modified_question = f"{original_question} (Improved)"
            
            # Create a suggestion with the modified question
            suggestion_data = {
                "suggestedQuestion": modified_question,
                "suggestedAnswers": question['answers']  # Keep the same answers
            }
            
            print(f"Student submitting edit suggestion for question: {original_question[:30]}...")
            result = submit_edit_suggestion(student_token, question['_id'], suggestion_data)
            if result and result.get('editSuggestions'):
                suggestion_id = result['editSuggestions'][-1]['_id']
                print(f"Created suggestion ID: {suggestion_id}")
                
                # Faculty handles some suggestions
                if i % 2 == 0:
                    status = "accepted" if i % 4 == 0 else "rejected"
                    comment = "Great improvement!" if status == "accepted" else "Please be more specific with your changes."
                    print(f"Faculty {status} suggestion for question ID: {question['_id']}")
                    handle_suggestion(faculty_token, question['_id'], suggestion_id, status, comment)
    
    # Submit grades for some questions
    if all_questions:
        print("\nSubmitting grades for questions...")
        for i, question in enumerate(all_questions[:3]):  # Grade first few questions
            student_token = student_tokens[i % len(student_tokens)]
            
            grades_data = {
                "questionScore": random.randint(1, 3),
                "answerGrades": []
            }
            
            # Grade each answer
            for j, answer in enumerate(question['answers']):
                grades_data["answerGrades"].append({
                    "answerId": answer['_id'],
                    "score": random.randint(1, 3)
                })
            
            print(f"Student submitting grades for question: {question['question'][:30]}...")
            result = submit_grades(student_token, question['_id'], grades_data)
            if result:
                print(f"Submitted grades for question ID: {question['_id']}")
    
    # Create database backup
    print("\nCreating database backup with demo data...")
    backup_name = backup_database()
    
    if backup_name:
        print(f"\n===== Demo Data Creation Complete =====")
        print(f"A backup of the demo database has been created: {backup_name}")
        print(f"You can restore this backup at any time using: ./scripts/restore-db.sh {backup_name}")
        print("\nDemo user accounts:")
        print("-------------------")
        for user in FACULTY_USERS:
            print(f"Faculty: {user['name']} / Email: {user['email']} / Password: {user['password']}")
        for user in STUDENT_USERS:
            print(f"Student: {user['name']} / Email: {user['email']} / Password: {user['password']}")
    else:
        print("Failed to create database backup")

if __name__ == "__main__":
    main()