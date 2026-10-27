package lab2;

import com.fastcgi.FCGIInterface;

import java.io.IOException;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

public class Main {
    private static final int MAX_BODY_BYTES = 8 * 1024;

    private static final List<Result> history = new ArrayList<>();

    public static void main(String[] args) throws IOException {
        PrintStream log = System.err;
        log.println("FastCGI-сервер запущен, порт " + System.getProperty("FCGI_PORT"));

        FCGIInterface fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            long start = System.nanoTime();
            String response = handle(FCGIInterface.request.params, start);
            System.out.write(response.getBytes(StandardCharsets.UTF_8));
            System.out.flush();
        }
        log.println("FCGIaccept вернул ошибку, сервер остановлен");
    }

    private static String handle(Properties params, long start) {
        try {
            String method = params.getProperty("REQUEST_METHOD", "");
            if (method.equals("POST")) {
                Point point = Validator.validate(readForm(params));
                boolean hit = AreaChecker.isHit(point);
                long execNanos = System.nanoTime() - start;
                history.add(new Result(point, hit, Instant.now(), execNanos));
                return response(200, "OK", Json.history(history));
            } else if (method.equals("GET")) {
                return response(200, "OK", Json.history(history));
            } else if (method.equals("DELETE")) {
                history.clear();
                return response(200, "OK", Json.history(history));
            } else {
                return response(405, "Method Not Allowed", Json.error("Разрешены только GET, POST и DELETE"));
            }
        } catch (ValidationException e) {
            return response(400, "Bad Request", Json.error(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return response(500, "Internal Server Error", Json.error("Внутренняя ошибка сервера"));
        }
    }

    private static FormData readForm(Properties params) throws IOException {
        int length = Integer.parseInt(params.getProperty("CONTENT_LENGTH", "0"));
        if (length > MAX_BODY_BYTES) {
            throw new ValidationException("Запрос слишком большой (больше " + MAX_BODY_BYTES / 1024 + " КБ)");
        }
        byte[] body = FCGIInterface.request.inStream.readNBytes(length);
        return new FormData(body);
    }

    private static String response(int status, String reason, String json) {
        return "HTTP/1.1 " + status + " " + reason + "\r\n"
                + "Content-Type: application/json; charset=utf-8\r\n"
                + "Content-Length: " + json.getBytes(StandardCharsets.UTF_8).length + "\r\n"
                + "\r\n"
                + json;
    }
}
