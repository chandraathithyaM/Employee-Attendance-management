@Override
protected void doFilterInternal(HttpServletRequest request,
                               HttpServletResponse response,
                               FilterChain filterChain)
        throws ServletException, IOException {

    String path = request.getServletPath();

    // ✅ Skip auth endpoints
    if (path.startsWith("/api/auth")) {
        filterChain.doFilter(request, response);
        return;
    }

    // ✅ Skip preflight requests (IMPORTANT)
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
        filterChain.doFilter(request, response);
        return;
    }

    String authHeader = request.getHeader("Authorization");

    // ✅ No token → continue (don’t block)
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        filterChain.doFilter(request, response);
        return;
    }

    try {
        String token = authHeader.substring(7);

        if (jwtService.isTokenValid(token)) {

            String email = jwtService.extractEmail(token);
            String role = jwtService.extractRole(token);

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(new SimpleGrantedAuthority(role))
                    );

            // ✅ Set authentication safely
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

    } catch (Exception e) {
        // ❗ Never break request flow
        System.out.println("JWT error: " + e.getMessage());
    }

    filterChain.doFilter(request, response);
}
