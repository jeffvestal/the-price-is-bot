import pytest
from app.services.llm_service import handle_llm_interaction

@pytest.mark.asyncio
async def test_handle_llm_interaction():
    username = "test_user"
    user_message = "Find items under $10"
    responses = []
    async for response in handle_llm_interaction(username, user_message):
        responses.append(response)
    assert len(responses) > 0
