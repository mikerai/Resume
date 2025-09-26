#!/usr/bin/env python3
"""
Validation script for RAG Financiero México - Web Chatbot deployment
Run this script after deploying the workflow to verify everything works correctly.
"""

import requests
import json
import sys
from datetime import datetime

class WorkflowValidator:
    def __init__(self, n8n_base_url, webhook_path="financial-chat"):
        self.n8n_base_url = n8n_base_url.rstrip('/')
        self.webhook_url = f"{self.n8n_base_url}/webhook/{webhook_path}"
        self.results = []

    def log_result(self, test_name, success, message, details=None):
        """Log a test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")

        self.results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_webhook_connectivity(self):
        """Test basic webhook connectivity"""
        try:
            response = requests.post(
                self.webhook_url,
                json={"message": "test connectivity"},
                timeout=30
            )

            if response.status_code == 200:
                self.log_result(
                    "Webhook Connectivity",
                    True,
                    f"Webhook responding (Status: {response.status_code})",
                    {"response_time": response.elapsed.total_seconds()}
                )
                return True
            else:
                self.log_result(
                    "Webhook Connectivity",
                    False,
                    f"Webhook returned status {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False

        except requests.exceptions.RequestException as e:
            self.log_result(
                "Webhook Connectivity",
                False,
                f"Connection failed: {str(e)}"
            )
            return False

    def test_basic_chat(self):
        """Test basic chat functionality"""
        test_message = {
            "message": "Hola, ¿puedes ayudarme con una consulta financiera básica?",
            "sessionId": f"test-session-{datetime.now().timestamp()}",
            "userId": "test-user"
        }

        try:
            response = requests.post(
                self.webhook_url,
                json=test_message,
                timeout=60
            )

            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'message' in data.get('data', {}):
                    self.log_result(
                        "Basic Chat",
                        True,
                        "AI agent responded successfully",
                        {"response_length": len(data['data']['message'])}
                    )
                    return True
                else:
                    self.log_result(
                        "Basic Chat",
                        False,
                        "Invalid response format",
                        {"response": data}
                    )
                    return False
            else:
                self.log_result(
                    "Basic Chat",
                    False,
                    f"Chat request failed with status {response.status_code}"
                )
                return False

        except Exception as e:
            self.log_result(
                "Basic Chat",
                False,
                f"Chat test failed: {str(e)}"
            )
            return False

    def test_financial_query(self):
        """Test financial-specific query"""
        financial_message = {
            "message": "¿Puedes explicarme cómo analizar mi flujo de efectivo en pesos mexicanos?",
            "sessionId": f"financial-test-{datetime.now().timestamp()}",
            "userId": "financial-test-user",
            "queryType": "cashflow"
        }

        try:
            response = requests.post(
                self.webhook_url,
                json=financial_message,
                timeout=60
            )

            if response.status_code == 200:
                data = response.json()
                response_text = data.get('data', {}).get('message', '').lower()

                # Check for Mexican financial terms
                mexican_terms = ['peso', 'mxn', 'méxico', 'flujo', 'efectivo', 'financiero']
                found_terms = [term for term in mexican_terms if term in response_text]

                if found_terms:
                    self.log_result(
                        "Financial Query",
                        True,
                        f"AI understands Mexican financial context",
                        {"mexican_terms_found": found_terms}
                    )
                    return True
                else:
                    self.log_result(
                        "Financial Query",
                        False,
                        "AI response lacks Mexican financial context"
                    )
                    return False
            else:
                self.log_result(
                    "Financial Query",
                    False,
                    f"Financial query failed with status {response.status_code}"
                )
                return False

        except Exception as e:
            self.log_result(
                "Financial Query",
                False,
                f"Financial query test failed: {str(e)}"
            )
            return False

    def test_chart_generation(self):
        """Test chart generation capability"""
        chart_message = {
            "message": "Genera un gráfico de mis ingresos trimestrales",
            "sessionId": f"chart-test-{datetime.now().timestamp()}",
            "userId": "chart-test-user",
            "queryType": "reporting"
        }

        try:
            response = requests.post(
                self.webhook_url,
                json=chart_message,
                timeout=60
            )

            if response.status_code == 200:
                data = response.json()
                has_chart = data.get('data', {}).get('has_chart', False)
                chart_config = data.get('data', {}).get('chart_config')

                if has_chart and chart_config:
                    self.log_result(
                        "Chart Generation",
                        True,
                        "Chart generation working",
                        {"chart_type": chart_config.get('type')}
                    )
                    return True
                else:
                    self.log_result(
                        "Chart Generation",
                        False,
                        "No chart generated for reporting query"
                    )
                    return False
            else:
                self.log_result(
                    "Chart Generation",
                    False,
                    f"Chart test failed with status {response.status_code}"
                )
                return False

        except Exception as e:
            self.log_result(
                "Chart Generation",
                False,
                f"Chart generation test failed: {str(e)}"
            )
            return False

    def test_session_memory(self):
        """Test session memory functionality"""
        session_id = f"memory-test-{datetime.now().timestamp()}"

        # First message
        message1 = {
            "message": "Mi empresa se llama TechMex SA de CV",
            "sessionId": session_id,
            "userId": "memory-test-user"
        }

        # Second message referencing first
        message2 = {
            "message": "¿Cuál es el nombre de mi empresa que te acabo de mencionar?",
            "sessionId": session_id,
            "userId": "memory-test-user"
        }

        try:
            # Send first message
            response1 = requests.post(self.webhook_url, json=message1, timeout=60)
            if response1.status_code != 200:
                self.log_result("Session Memory", False, "First message failed")
                return False

            # Send second message
            response2 = requests.post(self.webhook_url, json=message2, timeout=60)
            if response2.status_code == 200:
                data = response2.json()
                response_text = data.get('data', {}).get('message', '').lower()

                if 'techmex' in response_text:
                    self.log_result(
                        "Session Memory",
                        True,
                        "Session memory is working correctly"
                    )
                    return True
                else:
                    self.log_result(
                        "Session Memory",
                        False,
                        "AI didn't remember information from previous message"
                    )
                    return False
            else:
                self.log_result(
                    "Session Memory",
                    False,
                    f"Second message failed with status {response2.status_code}"
                )
                return False

        except Exception as e:
            self.log_result(
                "Session Memory",
                False,
                f"Session memory test failed: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all validation tests"""
        print("🚀 Starting RAG Financiero México Workflow Validation")
        print("=" * 60)

        tests = [
            self.test_webhook_connectivity,
            self.test_basic_chat,
            self.test_financial_query,
            self.test_chart_generation,
            self.test_session_memory
        ]

        passed = 0
        total = len(tests)

        for test in tests:
            if test():
                passed += 1
            print()  # Add spacing between tests

        # Summary
        print("=" * 60)
        print(f"🎯 VALIDATION SUMMARY")
        print(f"Passed: {passed}/{total} tests")
        print(f"Success Rate: {(passed/total)*100:.1f}%")

        if passed == total:
            print("🎉 All tests passed! Workflow is ready for production.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the issues above.")
            return False

    def save_report(self, filename="validation_report.json"):
        """Save detailed validation report"""
        report = {
            "validation_timestamp": datetime.now().isoformat(),
            "n8n_instance": self.n8n_base_url,
            "webhook_url": self.webhook_url,
            "total_tests": len(self.results),
            "passed_tests": sum(1 for r in self.results if r["success"]),
            "success_rate": (sum(1 for r in self.results if r["success"]) / len(self.results)) * 100,
            "test_results": self.results
        }

        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"📄 Detailed report saved to: {filename}")

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python validate_deployment.py <n8n_base_url>")
        print("Example: python validate_deployment.py https://your-n8n-instance.com")
        sys.exit(1)

    n8n_url = sys.argv[1]

    validator = WorkflowValidator(n8n_url)
    success = validator.run_all_tests()
    validator.save_report()

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()