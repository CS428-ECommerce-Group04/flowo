package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

// performAuth tries to signup (optional) and login to obtain a session cookie.
// It sets the Authorization header in the config if a bearer token is returned.
// For session-cookie auth (preferred by backend), we capture the Set-Cookie.
func performAuth(cfg *Config, client *http.Client) (string, error) {
    if cfg.Auth.Email == "" || cfg.Auth.Password == "" {
        // Auto-generate email if not provided
        if cfg.Auth.Email == "" {
            cfg.Auth.Email = fmt.Sprintf("perf.user+%d@example.com", time.Now().UnixNano())
        }
    }

    base := cfg.BaseURL

    // Optional signup to ensure account exists; capture temp password if provided
    if cfg.Auth.SignupFirst {
        payload := map[string]string{"email": cfg.Auth.Email}
        body, _ := json.Marshal(payload)
        req, _ := http.NewRequest("POST", base+cfg.Auth.SignupEndpoint, bytes.NewReader(body))
        req.Header.Set("Content-Type", "application/json")
        resp, err := client.Do(req)
        if err == nil && resp != nil {
            defer resp.Body.Close()
            // If created, parse temp password from response
            if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
                var signupResp struct {
                    Success  bool   `json:"success"`
                    Password string `json:"password"`
                }
                _ = json.NewDecoder(resp.Body).Decode(&signupResp)
                if cfg.Auth.Password == "" && signupResp.Password != "" {
                    cfg.Auth.Password = signupResp.Password
                }
            }
        }
    }

    // Login to obtain session cookie
    loginPayload := map[string]interface{}{
        "email":             cfg.Auth.Email,
        "password":          cfg.Auth.Password,
        "returnSecureToken": true,
    }
    lb, _ := json.Marshal(loginPayload)
    req, err := http.NewRequest("POST", base+cfg.Auth.LoginEndpoint, bytes.NewReader(lb))
    if err != nil {
        return "", err
    }
    req.Header.Set("Content-Type", "application/json")
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    if resp.StatusCode >= 300 {
        return "", fmt.Errorf("login failed: status %d", resp.StatusCode)
    }

    // Extract Set-Cookie header (session_id)
    var sessionCookie string
    for _, c := range resp.Cookies() {
        if c.Name == "session_id" && c.Value != "" {
            sessionCookie = c.Name + "=" + c.Value
            break
        }
    }
    return sessionCookie, nil
}


