<template>
    <footer>
        <div class="content d-flex flex-column justify-content-center align-items-center text-center">
            <img src="../assets/logo.png" alt="Logo" class="logo">
            <div class="line"></div>
            <h1 style="font-size: 50px;">Join the community!</h1>
            <div style="width: 200px;">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>
        </div>
        <div class="social d-flex flex-column justify-content-center align-items-center">
            <div class="container">
                <div class="row justify-content-center flex-column flex-xl-row m-2">
                    <a class="sol facebook col-12 col-xl-2 text-center"><i class="fa-brands fa-facebook"></i></a>
                    <a class="sol tiktok col-12 col-xl-2 text-center"><i class="fa-brands fa-tiktok"></i></a>
                    <a class="sol ins col-12 col-xl-2 text-center"><i class="fa-brands fa-square-instagram"></i></a>
                    <a class="sol youtobe col-12 col-xl-2 text-center"><i class="fa-brands fa-youtube"></i></a>
                    <a class="sol telegram col-12 col-xl-2 text-center"><i class="fa-brands fa-telegram"></i></a>
                </div>

            </div>
            <div class="line"></div>
            <div class="mb-3">@2024 by Hurminity Charity Travel</div>
        </div>
    </footer>
</template>
<style scoped>
footer {
    background-image: url('https://media.istockphoto.com/id/1365100258/vi/anh/nh%C3%ACn-t%E1%BB%AB-tr%C3%AAn-kh%C3%B4ng-c%E1%BB%A7a-thuy%E1%BB%81n-v%C3%A0-nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91i-tr%C3%AAn-h%E1%BB%93-thuy%E1%BB%81n-%C4%91i-qua-lau-s%E1%BA%ADy-chuy%E1%BA%BFn-%C4%91i-thuy%E1%BB%81n.jpg?s=2048x2048&w=is&k=20&c=YtfFaKyvq1QFRGNSe3kQJnbS09n1ZVAmF7eaGhmjcjo=');
    /* background-position:center; */
    background-size: cover;
    background-repeat: no-repeat;
    padding-bottom: 10px;
    /* background-color: #1f; */
    position:relative;
}
.content {
    /* background-color: bisque; */
    padding: 30px 60px 60px 60px;
    /* color: #1f445f; */
    color: #fff;
}

.content .line {
    background: linear-gradient(to right, transparent, #fff, transparent); 
}

.line {
  width: 70%; /* Chiều dài đường line */
  height: 0.5px; /* Độ dày của đường line */
  background: linear-gradient(to right, transparent, #1f445f, transparent); /* Tạo hiệu ứng gradient */
  margin: 30px;
}


.social {
    /* background-color: rgba(240, 240, 240, 1); */
    background-color: #fff;
    border-radius: 20px;
    margin: 10px;
}
.social .container {
    border-radius: 50px;
    /* border: 1px solid #1f445f; */
    margin-top:30px;
    width: 70%;
    color: #1f445f;
    font-size: 22px;
}

.social .sol {
    border-radius: 50px;
    padding: 10px 0;
    border: 1px solid #1f445f;
    text-align: center;
    color:#1f445f;
    font-weight: bold;
}

.social .sol:hover {
    background-color: #1f445f;
    color: white;
}

.logo {
    position: absolute;
    width: 125px;
    top: -10px;
}
</style>