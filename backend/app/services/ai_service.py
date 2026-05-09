import g4f

async def generate_financial_summary(transactions_data: str) -> str:
    """
    Takes a string representation of recent transactions and uses g4f
    to generate a short, insightful financial summary.
    """
    prompt = f"""
    You are a professional AI financial advisor. Analyze the following list of transactions from the last 30 days and provide a short, encouraging, and insightful summary of the user's spending habits. Highlight any areas where they spent a lot, and give a brief tip. Keep it under 100 words.

    Transactions Data:
    {transactions_data}
    """

    try:
        # We use a known working free provider or let g4f auto-select.
        # It's usually best to use g4f.client.AsyncClient or standard g4f.ChatCompletion
        response = await g4f.ChatCompletion.create_async(
            model=g4f.models.gpt_4o_mini,
            messages=[{"role": "user", "content": prompt}],
        )
        return response
    except Exception as e:
        print(f"Error generating AI summary: {e}")
        return "I'm currently unable to generate insights at this moment. Please try again later."
