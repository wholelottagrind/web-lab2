package lab2;

import java.nio.charset.StandardCharsets;

public final class HttpResponse {
    private HttpResponse() {
    }

    public static byte[] ok(String json) {
        return build(200, "OK", json);
    }

    public static byte[] error(int status, String reason, String message) {
        return build(status, reason, Json.error(message));
    }

    private static byte[] build(int status, String reason, String json) {
        byte[] body = json.getBytes(StandardCharsets.UTF_8);
        String head = "HTTP/1.1 " + status + " " + reason + "\r\n"
                + "Content-Type: application/json; charset=utf-8\r\n"
                + "Content-Length: " + body.length + "\r\n"
                + "Cache-Control: no-store\r\n"
                + "Connection: close\r\n"
                + "\r\n";
        byte[] headBytes = head.getBytes(StandardCharsets.US_ASCII);

        byte[] response = new byte[headBytes.length + body.length];
        System.arraycopy(headBytes, 0, response, 0, headBytes.length);
        System.arraycopy(body, 0, response, headBytes.length, body.length);
        return response;
    }
}
