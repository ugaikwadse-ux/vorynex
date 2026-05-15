# PhonePe Spring Boot Backend Integration (v2 API)

This document contains the complete Java implementation for your PhonePe backend using the REST API (v2) as requested.

## 1. PhonePeConfig.java
Store your credentials here.

```java
import org.springframework.context.annotation.Configuration;

@Configuration
public class PhonePeConfig {
    public static final String MERCHANT_ID = "YOUR_MERCHANT_ID";
    public static final String ACCESS_TOKEN = "YOUR_BEARER_TOKEN"; // O-Bearer
    public static final String BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
}
```

## 2. PhonePeController.java
The API endpoints for your frontend.

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1.0/phonePe/payment")
@CrossOrigin(origins = "*") // Enable CORS for local testing
public class PhonePeController {

    @Autowired
    private PhonePeService phonePeService;

    @PostMapping("/create")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> request) {
        try {
            Long amount = ((Number) request.get("amount")).longValue();
            Map<String, Object> response = phonePeService.initiateTransaction(amount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> request) {
        try {
            String orderId = request.get("orderId");
            boolean isSuccess = phonePeService.checkStatus(orderId);
            return ResponseEntity.ok(Map.of("status", isSuccess ? "SUCCESS" : "FAILED"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
```

## 3. PhonePeService.java
The core logic for calling PhonePe REST APIs.

```java
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
public class PhonePeService {

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> initiateTransaction(Long amount) {
        String url = PhonePeConfig.BASE_URL + "/checkout/v2/pay";
        String merchantOrderId = "VRY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Prepare Request Body
        Map<String, Object> paymentFlow = new HashMap<>();
        paymentFlow.put("type", "PG_CHECKOUT");
        
        Map<String, String> merchantUrls = new HashMap<>();
        // Note: Replace this with your actual success page URL
        merchantUrls.put("redirectUrl", "http://localhost:5500/phonepe-checkout.html"); 
        paymentFlow.put("merchantUrls", merchantUrls);

        Map<String, Object> body = new HashMap<>();
        body.put("merchantOrderId", merchantOrderId);
        body.put("amount", amount);
        body.put("expireAfter", 900); // 15 mins
        body.put("paymentFlow", paymentFlow);

        // Headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "O-Bearer " + PhonePeConfig.ACCESS_TOKEN);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        // Call API
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        Map<String, Object> resBody = response.getBody();

        // Extract and Return
        return Map.of(
            "orderId", resBody.get("orderId"),
            "state", resBody.get("state"),
            "redirectUrl", resBody.get("redirectUrl")
        );
    }

    public boolean checkStatus(String orderId) {
        String url = PhonePeConfig.BASE_URL + "/checkout/v2/order/" + orderId + "/status";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "O-Bearer " + PhonePeConfig.ACCESS_TOKEN);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            String state = (String) response.getBody().get("state");
            return "COMPLETED".equalsIgnoreCase(state);
        } catch (Exception e) {
            return false;
        }
    }
}
```
