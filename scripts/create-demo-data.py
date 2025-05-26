#!/usr/bin/env python3
import os
import sys
import json
import time
import random
import requests
import subprocess
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any

# Configuration
BASE_URL = "http://localhost:3000/api"
WORKSPACE_DIR = "/workspaces/QuestionWriting"
MONGO_DB = "mcq-writing-app"

# Demo users data
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

class DemoDataCreator:
    def __init__(self):
        self.faculty_tokens = []
        self.student_tokens = []
        self.faculty_ids = []
        self.student_ids = []
        self.lectures = []
        self.questions = []
        self.session = requests.Session()
        self.admin_token = None

    def check_server_running(self) -> bool:
        """Check if the API server is running"""
        try:
            response = self.session.get(f"{BASE_URL}/users/profile", timeout=5)
            return True
        except requests.RequestException:
            return False

    def clear_database(self) -> bool:
        """Clear the database using clear-db.sh"""
        try:
            script_path = f"{WORKSPACE_DIR}/scripts/clear-db.sh"
            subprocess.run([script_path], check=True, capture_output=True, text=True)
            
            # Create admin user after clearing the database
            admin_script_path = f"{WORKSPACE_DIR}/scripts/force-create-admin.js"
            subprocess.run(["node", admin_script_path], check=True, capture_output=True, text=True)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error clearing database: {e}")
            print(f"stdout: {e.stdout}")
            print(f"stderr: {e.stderr}")
            return False

    def register_user(self, user_data: Dict[str, str], role: str) -> Optional[Dict[str, Any]]:
        """Register a new user with error handling"""
        try:
            user_data["role"] = role
            print(f"Registering {user_data['name']}...")
            
            response = self.session.post(f"{BASE_URL}/users/register", json=user_data)
            response.raise_for_status()
            
            registered_user = response.json()
            print(f"Created {role}: {registered_user['name']} (ID: {registered_user['_id']})")
            
            user_id = registered_user['_id']
            
            # Use admin token to activate the user
            admin_token = self.admin_token
            activate_response = self.session.put(
                f"{BASE_URL}/users/{user_id}/activate",
                json={"role": role},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            activate_response.raise_for_status()
            
            # Set initial password
            set_password_response = self.session.post(
                f"{BASE_URL}/users/set-password",
                json={"userId": user_id, "password": user_data["password"]}
            )
            set_password_response.raise_for_status()
            
            # Login to get token again after activation
            login_response = self.session.post(
                f"{BASE_URL}/users/login",
                json={"email": user_data["email"], "password": user_data["password"]}
            )
            login_response.raise_for_status()
            
            return login_response.json()
        except requests.RequestException as e:
            print(f"Error creating user {user_data['email']}: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
            return None

    def create_users(self) -> bool:
        """Create faculty and student users"""
        print("\nCreating faculty users...")
        for user_data in FACULTY_USERS:
            if user := self.register_user(user_data, "faculty"):
                self.faculty_tokens.append(user["token"])
                self.faculty_ids.append(user["_id"])
        
        if not self.faculty_tokens:
            print("Error: No faculty accounts were created")
            return False
        
        print("\nCreating student users...")
        for user_data in STUDENT_USERS:
            if user := self.register_user(user_data, "student"):
                self.student_tokens.append(user["token"])
                self.student_ids.append(user["_id"])
        
        return bool(self.student_tokens)

    def create_lectures(self) -> bool:
        """Create demo lectures"""
        print("\nCreating lectures...")
        faculty_token = self.faculty_tokens[0]
        
        for lecture_data in LECTURES:
            try:
                response = self.session.post(
                    f"{BASE_URL}/lectures",
                    json=lecture_data,
                    headers={"Authorization": f"Bearer {faculty_token}"}
                )
                response.raise_for_status()
                lecture = response.json()
                print(f"Created lecture: {lecture['title']} (ID: {lecture['_id']})")
                self.lectures.append(lecture)
            except requests.RequestException as e:
                print(f"Error creating lecture {lecture_data['title']}: {str(e)}")
                if hasattr(e, 'response') and e.response:
                    print(f"Response: {e.response.text}")
        
        return bool(self.lectures)

    def add_students_to_lectures(self) -> bool:
        """Add students to lectures with different distributions"""
        if not self.lectures:
            return False
        
        faculty_token = self.faculty_tokens[0]
        success = True
        
        # Add all students to first lecture
        try:
            first_lecture = self.lectures[0]
            response = self.session.post(
                f"{BASE_URL}/lectures/{first_lecture['_id']}/students",
                json={"studentIds": self.student_ids},
                headers={"Authorization": f"Bearer {faculty_token}"}
            )
            response.raise_for_status()
            print(f"Added all students to lecture: {first_lecture['title']}")
        except requests.RequestException as e:
            print(f"Error adding students to first lecture: {str(e)}")
            success = False
        
        # Add alternating students to other lectures
        for i, lecture in enumerate(self.lectures[1:], 1):
            selected_students = self.student_ids[i-1::2]
            try:
                response = self.session.post(
                    f"{BASE_URL}/lectures/{lecture['_id']}/students",
                    json={"studentIds": selected_students},
                    headers={"Authorization": f"Bearer {faculty_token}"}
                )
                response.raise_for_status()
                print(f"Added {len(selected_students)} students to lecture: {lecture['title']}")
            except requests.RequestException as e:
                print(f"Error adding students to lecture {lecture['title']}: {str(e)}")
                success = False
        
        return success

    def create_questions(self) -> bool:
        """Create questions from both faculty and students"""
        print("\nCreating questions...")
        faculty_token = self.faculty_tokens[0]
        success = True
        
        # Faculty questions
        num_faculty_questions = min(6, len(QUESTION_TEMPLATES))
        for i in range(num_faculty_questions):
            template = QUESTION_TEMPLATES[i]
            try:
                response = self.session.post(
                    f"{BASE_URL}/questions",
                    json=template,
                    headers={"Authorization": f"Bearer {faculty_token}"}
                )
                response.raise_for_status()
                question = response.json()
                print(f"Faculty created question ID: {question['_id']}")
                self.questions.append(question)
                
                # Finalize some questions
                if i % 2 == 0:
                    finalize_response = self.session.put(
                        f"{BASE_URL}/questions/{question['_id']}/finalize",
                        headers={"Authorization": f"Bearer {faculty_token}"}
                    )
                    finalize_response.raise_for_status()
                    print(f"Finalized question ID: {question['_id']}")
            except requests.RequestException as e:
                print(f"Error creating faculty question: {str(e)}")
                success = False
        
        # Student questions
        remaining_templates = QUESTION_TEMPLATES[num_faculty_questions:]
        for i, template in enumerate(remaining_templates):
            student_token = self.student_tokens[i % len(self.student_tokens)]
            try:
                response = self.session.post(
                    f"{BASE_URL}/questions",
                    json=template,
                    headers={"Authorization": f"Bearer {student_token}"}
                )
                response.raise_for_status()
                question = response.json()
                print(f"Student created question ID: {question['_id']}")
                self.questions.append(question)
            except requests.RequestException as e:
                print(f"Error creating student question: {str(e)}")
                success = False
        
        return success

    def create_suggestions_and_grades(self) -> bool:
        """Create edit suggestions and grades for questions"""
        if not self.questions:
            return False
        
        success = True
        faculty_token = self.faculty_tokens[0]
        
        # Create edit suggestions
        print("\nCreating edit suggestions...")
        for i, question in enumerate(self.questions[:4]):
            student_token = self.student_tokens[i % len(self.student_tokens)]
            
            suggestion_data = {
                "suggestedQuestion": f"{question['question']} (Improved)",
                "suggestedAnswers": question['answers']
            }
            
            try:
                response = self.session.post(
                    f"{BASE_URL}/questions/{question['_id']}/suggestions",
                    json=suggestion_data,
                    headers={"Authorization": f"Bearer {student_token}"}
                )
                response.raise_for_status()
                result = response.json()
                
                if suggestion_id := result['editSuggestions'][-1]['_id']:
                    print(f"Created suggestion ID: {suggestion_id}")
                    
                    # Faculty handles some suggestions
                    if i % 2 == 0:
                        status = "accepted" if i % 4 == 0 else "rejected"
                        comment = "Great improvement!" if status == "accepted" else "Please be more specific."
                        
                        handle_response = self.session.put(
                            f"{BASE_URL}/questions/{question['_id']}/suggestions/{suggestion_id}",
                            json={"status": status, "rebuttalComment": comment},
                            headers={"Authorization": f"Bearer {faculty_token}"}
                        )
                        handle_response.raise_for_status()
                        print(f"Faculty {status} suggestion for question ID: {question['_id']}")
            except requests.RequestException as e:
                print(f"Error with suggestion for question {question['_id']}: {str(e)}")
                success = False
        
        # Submit grades
        print("\nSubmitting grades for questions...")
        for i, question in enumerate(self.questions[:3]):
            student_token = self.student_tokens[i % len(self.student_tokens)]
            
            grades_data = {
                "questionScore": random.randint(1, 3),
                "answerGrades": [
                    {"answerId": answer['_id'], "score": random.randint(1, 3)}
                    for answer in question['answers']
                ]
            }
            
            try:
                response = self.session.post(
                    f"{BASE_URL}/questions/{question['_id']}/grades",
                    json=grades_data,
                    headers={"Authorization": f"Bearer {student_token}"}
                )
                response.raise_for_status()
                print(f"Submitted grades for question ID: {question['_id']}")
            except requests.RequestException as e:
                print(f"Error submitting grades for question {question['_id']}: {str(e)}")
                success = False
        
        return success

    def create_backup(self) -> Optional[str]:
        """Create a backup of the demo data"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_name = f"demo-data_{timestamp}"
            
            script_path = f"{WORKSPACE_DIR}/scripts/backup-db.sh"
            result = subprocess.run([script_path, backup_name], check=True, capture_output=True, text=True)
            print(f"Database backup created: {backup_name}")
            return backup_name
        except subprocess.CalledProcessError as e:
            print(f"Error creating backup: {e}")
            print(f"stdout: {e.stdout}")
            print(f"stderr: {e.stderr}")
            return None

    def print_summary(self, backup_name: Optional[str]):
        """Print summary of created demo data"""
        print(f"\n===== Demo Data Creation {'Complete' if backup_name else 'Incomplete'} =====")
        if backup_name:
            print(f"A backup of the demo database has been created: {backup_name}")
            print(f"You can restore this backup at any time using: ./scripts/restore-db.sh {backup_name}")
        
        print("\nDemo user accounts:")
        print("-------------------")
        for user in FACULTY_USERS:
            print(f"Faculty: {user['name']} / Email: {user['email']} / Password: {user['password']}")
        for user in STUDENT_USERS:
            print(f"Student: {user['name']} / Email: {user['email']} / Password: {user['password']}")

    def main(self):
        self.admin_token = None
        
        print("===== Starting Demo Data Creation =====")
        
        # Check if server is running
        if not self.check_server_running():
            print("Error: API server is not running")
            print("Please start the server with ./scripts/start-debug.sh")
            sys.exit(1)
        
        # Clear the database
        print("\nClearing database...")
        if not self.clear_database():
            print("Error: Failed to clear database")
            sys.exit(1)
        
        # Login as admin to get token
        admin_login_response = self.session.post(
            f"{BASE_URL}/users/login",
            json={"email": "admin@example.com", "password": "adminpassword"}
        )
        admin_login_response.raise_for_status()
        self.admin_token = admin_login_response.json()["token"]
        
        # Create users
        if not self.create_users():
            print("Error: Failed to create users")
            sys.exit(1)
        
        # Create lectures
        if not self.create_lectures():
            print("Error: Failed to create lectures")
            sys.exit(1)
        
        # Add students to lectures
        self.add_students_to_lectures()
        
        # Create questions
        self.create_questions()
        
        # Create suggestions and grades
        self.create_suggestions_and_grades()
        
        # Create backup
        backup_name = self.create_backup()
        
        # Print summary
        self.print_summary(backup_name)

if __name__ == "__main__":
    creator = DemoDataCreator()
    creator.main()