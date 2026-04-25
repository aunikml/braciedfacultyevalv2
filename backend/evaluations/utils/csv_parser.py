import pandas as pd
import numpy as np

# Mapping for both Faculty and Course evaluations
SCORE_MAPPING = {
    'A: Excellent': 5,
    'B: Very Good': 4,
    'C: Good': 3,
    'D: Satisfactory': 2,
    'E: Not Satisfactory': 1,
    'A: Strongly Agree': 5,
    'B: Agree': 4,
    'C: Neutral': 3,
    'D: Disagree': 2,
    'E: Strongly Disagree': 1,
}

def parse_generic_evaluation_csv(file_path, type='faculty'):
    df = pd.read_csv(file_path)
    
    if type == 'faculty':
        criteria_cols = df.columns[1:9]
        comment_col = df.columns[9]
        total_max = 40 # 8 * 5
        bracu_standard = 60
        num_criteria = 8
    else: # course
        criteria_cols = df.columns[1:5]
        comment_col = df.columns[5]
        total_max = 20 # 4 * 5
        bracu_standard = 15
        num_criteria = 4
    
    total_respondents = len(df)
    processed_scores = []
    response_counts_per_criteria = []
    
    for col in criteria_cols:
        scores = df[col].map(lambda x: SCORE_MAPPING.get(str(x).strip(), 0))
        valid_scores = scores[scores > 0]
        avg = valid_scores.mean() if not valid_scores.empty else 0
        
        counts = df[col].value_counts().to_dict()
        clean_counts = {str(k).strip(): int(v) for k, v in counts.items()}
        
        processed_scores.append({
            'criteria': col.strip(),
            'average': round(float(avg), 2)
        })
        
        response_counts_per_criteria.append({
            'criteria': col.strip(),
            'counts': clean_counts
        })

    comments = df[comment_col].dropna().tolist()
    
    total_avg_raw = sum(item['average'] for item in processed_scores)
    total_scaled = round((total_avg_raw / total_max) * bracu_standard, 2) if total_avg_raw > 0 else 0
    avg_of_avgs = round(total_avg_raw / num_criteria, 2) if num_criteria > 0 else 0
    
    return {
        'total_respondents': total_respondents,
        'criteria_scores': processed_scores,
        'response_counts_per_criteria': response_counts_per_criteria,
        'comments': comments,
        'totals': {
            'raw_total': round(total_avg_raw, 2),
            'scaled_total': total_scaled,
            'avg_of_avgs': avg_of_avgs,
            'total_max': total_max,
            'scaled_max': bracu_standard
        }
    }

# Backward compatibility wrappers
def parse_faculty_evaluation_csv(file_path):
    return parse_generic_evaluation_csv(file_path, 'faculty')

def parse_course_evaluation_csv(file_path):
    return parse_generic_evaluation_csv(file_path, 'course')
