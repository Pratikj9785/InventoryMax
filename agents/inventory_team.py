import sys
import json
import os
from dotenv import load_dotenv
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager

load_dotenv()

def main():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY not found.")
        sys.exit(1)

    config_list = [{"model": "gpt-4o", "api_key": "mock", "base_url": "http://localhost:4000/v1"}]
    llm_config = {"config_list": config_list}

    # 1. Read Inventory Data from Stdin
    try:
        inventory_json = sys.stdin.read()
        inventory = json.loads(inventory_json)
    except Exception as e:
        inventory = []
        # Fallback or error

    # 2. Get User Context (Query)
    # Passed as first argument
    user_query = sys.argv[1] if len(sys.argv) > 1 else "Analyze inventory health."

    # 3. Define Agents
    
    # Boss / User Proxy
    user_proxy = UserProxyAgent(
        name="User_Proxy",
        system_message="A human admin. Approve plans.",
        code_execution_config={"last_n_messages": 2, "work_dir": "groupchat", "use_docker": False},
        human_input_mode="NEVER" # Automated for API response
    )

    # Inventory Analyst
    inventory_agent = AssistantAgent(
        name="Inventory_Analyst",
        llm_config=llm_config,
        system_message=f"""
        You are an expert Inventory Analyst. 
        You have access to the following inventory data: {json.dumps(inventory)}
        Your job is to identify Dead Stock (Age > 90 days), Low Stock (Qty < Threshold), and Overstock.
        Create a summary report.
        """
    )

    # Procurement Manager
    procurement_agent = AssistantAgent(
        name="Procurement_Manager",
        llm_config=llm_config,
        system_message="""
        You are a Procurement Manager. 
        Based on the Analyst's report, suggest Reorder Quantities (EOQ) and Clearance Sales for dead stock.
        Output your final recommendation as a JSON object with keys: "alerts" (list), "orders" (list), "clearance" (list).
        """
    )

    # 4. Group Chat
    groupchat = GroupChat(
        agents=[user_proxy, inventory_agent, procurement_agent], 
        messages=[], 
        max_round=6
    )
    manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)

    # 5. Initiate Chat
    # We ask the user_proxy to initiate with the user query
    user_proxy.initiate_chat(
        manager,
        message=user_query
    )

    # 6. Extract Result
    # Usually the last message content. For API, we might want to structure it.
    # Simple extraction:
    # print(json.dumps({"analysis": "Check logs"})) 
    # AutoGen prints to stdout, which our Node app captures. 
    # To return clean JSON, we rely on the Agents being instructed to output JSON at the end.

if __name__ == "__main__":
    main()
