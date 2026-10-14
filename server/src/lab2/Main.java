package lab2;

import com.fastcgi.FCGIInterface;

import java.io.IOException;
import java.io.PrintStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

public class Main {
    private static final int MAX_BODY_BYTES = 1024;

    private static final List<Result> history = new ArrayList<>();

    public static void main(String[] args) throws IOException {
        PrintStream log = System.err;
        log.println("FastCGI-сервер запущен, порт " + System.getProperty("FCGI_PORT"));

        FCGIInterface fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            long start = System.nanoTime();
            byte[] response = handle(FCGIInterface.request.params, start);
            System.out.write(response);
            System.out.flush();
        }
        log.println("FCGIaccept вернул ошибку, сервер остановлен");
    }

    private static byte[] handle(Properties params, long start) {
        try {
            String method = params.getProperty("REQUEST_METHOD", "");
            switch (method) {
                case "POST" -> {
                    Point point = Validator.validate(readForm(params));
                    boolean hit = AreaChecker.isHit(point.x(), point.y(), point.r());
                    long execNanos = System.nanoTime() - start;
                    history.add(new Result(point, hit, Instant.now(), execNanos));
                    return HttpResponse.ok(Json.history(history));
                }
                case "GET" -> {
                    return HttpResponse.ok(Json.history(history));
                }
                default -> {
                    return HttpResponse.error(405, "Method Not Allowed", "Разрешены только GET и POST");
                }
            }
        } catch (ValidationException e) {
            return HttpResponse.error(400, "Bad Request", e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return HttpResponse.error(500, "Internal Server Error", "Внутренняя ошибка сервера");
        }
    }

    private static FormData readForm(Properties params) throws IOException {
        String contentType = params.getProperty("CONTENT_TYPE", "");
        if (!contentType.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
            throw new ValidationException("Ожидается application/x-www-form-urlencoded");
        }
        int length;
        try {
            length = Integer.parseInt(params.getProperty("CONTENT_LENGTH", "0"));
        } catch (NumberFormatException e) {
            throw new ValidationException("Некорректный CONTENT_LENGTH");
        }
        if (length <= 0 || length > MAX_BODY_BYTES) {
            throw new ValidationException("Некорректный размер тела запроса");
        }
        byte[] body = FCGIInterface.request.inStream.readNBytes(length);
        return FormData.parse(body);
    }
}
