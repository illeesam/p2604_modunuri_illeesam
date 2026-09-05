package com.shopjoy.ecBeCdn.auth.service;

import com.shopjoy.ecBeCdn.auth.dto.CfClientCreateReq;
import com.shopjoy.ecBeCdn.auth.dto.CfClientDto;
import com.shopjoy.ecBeCdn.auth.dto.CfClientUpdateReq;
import com.shopjoy.ecBeCdn.auth.entity.CfClient;
import com.shopjoy.ecBeCdn.auth.repository.CfClientRepository;
import com.shopjoy.ecBeCdn.common.exception.CfBizException;
import com.shopjoy.ecBeCdn.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** cf_client(EcCdnApi 호출 계정) 관리 화면용 CRUD — 관리자 정적 페이지(static/cf-client.html) 전용. */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CfClientService {

    private final CfClientRepository cfClientRepository;
    private final PasswordEncoder passwordEncoder;

    public PageResult<CfClientDto> getPage(String keyword, int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(Math.max(0, pageNo - 1), pageSize, Sort.by(Sort.Direction.DESC, "regDate"));
        String kw = keyword == null ? "" : keyword;
        Page<CfClient> page = cfClientRepository.findByClientIdContainingOrClientNmContaining(kw, kw, pageable);
        return new PageResult<>(page.getContent().stream().map(CfClientDto::from).toList(),
            page.getTotalElements(), pageNo, pageSize);
    }

    public CfClientDto getById(String clientId) {
        return CfClientDto.from(getEntityOrThrow(clientId));
    }

    @Transactional
    public CfClientDto create(CfClientCreateReq req) {
        if (cfClientRepository.existsById(req.getClientId())) {
            throw new CfBizException("이미 사용 중인 clientId 입니다: " + req.getClientId());
        }
        LocalDateTime now = LocalDateTime.now();
        CfClient entity = CfClient.builder()
            .clientId(req.getClientId())
            .clientPwd(passwordEncoder.encode(req.getClientPwd()))
            .clientNm(req.getClientNm())
            .useYn("Y")
            .regBy("admin-ui")
            .regDate(now)
            .updBy("admin-ui")
            .updDate(now)
            .build();
        return CfClientDto.from(cfClientRepository.save(entity));
    }

    @Transactional
    public CfClientDto update(String clientId, CfClientUpdateReq req) {
        CfClient entity = getEntityOrThrow(clientId);
        if (req.getClientNm() != null && !req.getClientNm().isBlank()) entity.setClientNm(req.getClientNm());
        if (req.getUseYn() != null && !req.getUseYn().isBlank()) entity.setUseYn(req.getUseYn());
        if (req.getClientPwd() != null && !req.getClientPwd().isBlank()) {
            entity.setClientPwd(passwordEncoder.encode(req.getClientPwd()));
        }
        entity.setUpdBy("admin-ui");
        entity.setUpdDate(LocalDateTime.now());
        return CfClientDto.from(cfClientRepository.save(entity));
    }

    @Transactional
    public void delete(String clientId) {
        if (!cfClientRepository.existsById(clientId)) {
            throw new CfBizException("존재하지 않는 계정입니다: " + clientId);
        }
        cfClientRepository.deleteById(clientId);
        log.info("[CfClientService] 삭제 완료: clientId={}", clientId);
    }

    private CfClient getEntityOrThrow(String clientId) {
        return cfClientRepository.findById(clientId)
            .orElseThrow(() -> new CfBizException("존재하지 않는 계정입니다: " + clientId));
    }
}
