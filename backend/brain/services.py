import google.generativeai as genai
import os
from django.conf import settings
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key and api_key != 'your_gemini_api_key_here':
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.enabled = True
        else:
            self.enabled = False

    def generate_faculty_insights(self, faculty_name, course_name, processed_data):
        if not self.enabled:
            return "AI Insights are currently disabled (Missing API Key)."

        # Extract useful metrics
        totals = processed_data.get('totals', {})
        avg_score = totals.get('avg_of_avgs', 'N/A')
        total_respondents = processed_data.get('total_respondents', 0)
        
        # Collect all comments
        all_comments = []
        for q_id, q_data in processed_data.get('questions', {}).items():
            all_comments.extend(q_data.get('comments', []))
        
        # Sample comments if too many
        comments_str = "\n".join(all_comments[:30]) 

        prompt = f"""
        Analyze the following faculty evaluation data for {faculty_name} in the course '{course_name}'.
        
        Metrics:
        - Average Score: {avg_score}/5
        - Total Respondents: {total_respondents}
        
        Student Comments:
        {comments_str}
        
        Please provide:
        1. A brief executive summary (2 sentences).
        2. Top 3 Strengths (bullet points).
        3. Top 3 Improvement Areas (bullet points).
        4. One actionable piece of advice.
        
        Format the output clearly as JSON-like structure or clean text.
        Keep it professional and encouraging.
        """

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating insights: {str(e)}"

    def generate_global_faculty_insights(self, faculty_name, all_assignments):
        if not self.enabled:
            return "AI Insights are currently disabled (Missing API Key)."

        summary_data = []
        for asgn in all_assignments[:5]: # Take last 5 for context
            if asgn.processed_data:
                avg = asgn.processed_data.get('totals', {}).get('avg_of_avgs', 'N/A')
                course = asgn.evaluation_instance.course.name
                semester = f"{asgn.evaluation_instance.semester} {asgn.evaluation_instance.year}"
                summary_data.append(f"Course: {course} ({semester}), Avg Score: {avg}")

        summary_str = "\n".join(summary_data)

        prompt = f"""
        Provide a global performance summary for faculty member {faculty_name} based on their recent courses:
        
        Recent History:
        {summary_str}
        
        Please provide:
        1. A 'Career Trajectory' summary (Is performance improving, stable, or declining?).
        2. Key themes across all courses (What is this faculty member consistently good at?).
        3. Strategic advice for professional development.
        
        Format the output with professional headings and a supportive tone.
        """

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating global insights: {str(e)}"

    def generate_program_insights(self, program_name, faculty_data):
        if not self.enabled:
            return "AI Insights are currently disabled (Missing API Key)."

        faculty_summary = []
        for f in faculty_data:
            name = f['name']
            avg = f['avg_score']
            faculty_summary.append(f"Faculty: {name}, Avg Score: {avg}")

        summary_str = "\n".join(faculty_summary)

        prompt = f"""
        Analyze the overall academic performance for the program '{program_name}'.
        
        Faculty Performance Data:
        {summary_str}
        
        Please provide:
        1. A 'Program Health' overview (Are standards being met across the board?).
        2. Top performing faculty mention (Highlighting excellence).
        3. Areas for programmatic improvement (Is there a common weakness?).
        4. Strategic recommendations for the Program Supervisor.
        
        Format with professional headings.
        """

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating program insights: {str(e)}"
