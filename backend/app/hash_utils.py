import hashlib
import json
from datetime import datetime


def compute_project_hash(title: str, description: str, tech_stack: str) -> str:
    """
    MD5 hash of the three content fields (lowercased + stripped).
    If this matches project.project_hash, the content hasn't changed
    since the last analysis → block re-analysis.
    """
    content = (
        (title or "").strip().lower()
        + (description or "").strip().lower()
        + (tech_stack or "").strip().lower()
    )
    return hashlib.md5(content.encode()).hexdigest()


def can_analyze(project) -> tuple[bool, str]:
    """
    Returns (True, reason) if the project can be analysed.
    Returns (False, reason) if the content hasn't changed since last analysis.
    """
    if not project.ai_analysis_used:
        return True, "No previous analysis — ready to analyse."

    current_hash = compute_project_hash(
        project.title or "",
        project.description or "",
        project.tech_stack or "",
    )

    if current_hash == project.project_hash:
        return False, "Update your project content (title, description, or tech stack) to analyse again."

    return True, "Project updated — new analysis available."


def save_analysis_to_history(project, new_analysis: dict) -> str:
    """
    Append new_analysis to the project's history JSON array.
    Returns the serialised JSON string ready to be stored in project.analysis_history.
    """
    history: list = []
    if project.analysis_history:
        try:
            history = json.loads(project.analysis_history)
        except (json.JSONDecodeError, TypeError):
            history = []

    history.append({
        "analyzed_at": datetime.utcnow().isoformat(),
        "analysis": new_analysis,
        "score": new_analysis.get("overall_score"),
    })

    return json.dumps(history)
