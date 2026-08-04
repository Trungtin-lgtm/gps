def login_page():
    return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Login - GPS Stream</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        background: linear-gradient(to right, #00b4db, #0083b0);
                        font-family: 'Segoe UI', sans-serif;
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                        margin: 0;
                    }
                    .login-container {
                        background: white;
                        padding: 40px;
                        border-radius: 16px;
                        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                        width: 300px;
                    }
                    h2 {
                        margin-bottom: 20px;
                        color: #0083b0;
                        text-align: center;
                    }
                    input[type="email"], input[type="password"] {
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 16px;
                        border: 1px solid #ccc;
                        border-radius: 8px;
                    }
                    input[type="submit"] {
                        width: 100%;
                        background: #0083b0;
                        color: white;
                        padding: 12px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    }
                    input[type="submit"]:hover {
                        background: #005f73;
                    }
                    .error {
                        color: red;
                        text-align: center;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="login-container">
                    <h2>GPS Stream Login</h2>
                    <form method='POST' action='/login'>
                        <input type='email' name='email' placeholder='Email' required>
                        <input type='password' name='password' placeholder='Password' required>
                        <input type='submit' value='Login'>
                    </form>
                </div>
            </body>
            </html>
            """


def login_failed_page():
    return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Login Failed</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { 
                            background: #f8d7da;
                            font-family: Arial, sans-serif;
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh;
                            margin: 0;
                        }
                        .message-box {
                            background: white;
                            border: 1px solid #f5c6cb;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 5px 10px rgba(0,0,0,0.1);
                            text-align: center;
                        }
                        .message-box h2 {
                            color: #721c24;
                            margin-bottom: 20px;
                        }
                        .message-box a {
                            text-decoration: none;
                            color: #fff;
                            background-color: #dc3545;
                            padding: 10px 20px;
                            border-radius: 8px;
                        }
                    </style>
                </head>
                <body>
                    <div class="message-box">
                        <h2>Đăng nhập thất bại! Vui lòng kiểm tra lại Email và Mật khẩu.</h2>
                        <a href="/login">Quay lại đăng nhập</a>
                    </div>
                </body>
                </html>
                """

def server_down_page():
    return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Server Error</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { 
                            background: #fff3cd;
                            font-family: Arial, sans-serif;
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh;
                            margin: 0;
                        }
                        .message-box {
                            background: white;
                            border: 1px solid #ffeeba;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 5px 10px rgba(0,0,0,0.1);
                            text-align: center;
                        }
                        .message-box h2 {
                            color: #856404;
                            margin-bottom: 20px;
                        }
                        .message-box a {
                            text-decoration: none;
                            color: #fff;
                            background-color: #ffc107;
                            padding: 10px 20px;
                            border-radius: 8px;
                        }
                    </style>
                </head>
                <body>
                    <div class="message-box">
                        <h2>Không thể kết nối tới server GPS. Vui lòng kiểm tra và khởi động lại server.</h2>
                        <a href="/login">Thử lại</a>
                    </div>
                </body>
                </html>
                """

