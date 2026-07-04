from datetime import datetime

def date_format_change(date, current_form: str, new_form: str):
    date = str(date)

    new_date = datetime.strptime(date, current_form).date()
    new_date = new_date.strftime(new_form)
    return new_date