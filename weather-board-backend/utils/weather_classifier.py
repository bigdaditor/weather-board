def classify_rain(one_hour_rain: float) -> str:
    """
    1시간 최대 강우량(mm/h)을 받아서 강우 강도를 한글 설명으로 분류한다.

    참고:
    - one_hour_rain <= 0        : 강우 없음
    - 0 < one_hour_rain < 1    : 빗방울만 조금 떨어지는 정도
    - 1 ≤ one_hour_rain < 3     : 약한 비
    - 3 ≤ one_hour_rain < 10    : 보통 비
    - 10 ≤ one_hour_rain < 30   : 강한 비
    - 30 ≤ one_hour_rain < 50   : 매우 강한 비
    - 50 ≤ one_hour_rain         : 극심한 폭우
    """
    if one_hour_rain is None:
        return ""
    if one_hour_rain <= 0:
        return ""
    return "강우"

def classify_sky(avg_total_cloud: float) -> str:
    """
    일 전운량을 기준으로 하늘 상태를 분류한다.
    :param avg_total_cloud:
    :return:
    """
    if avg_total_cloud <= 0.54:
        return "맑음"
    return "흐림"
