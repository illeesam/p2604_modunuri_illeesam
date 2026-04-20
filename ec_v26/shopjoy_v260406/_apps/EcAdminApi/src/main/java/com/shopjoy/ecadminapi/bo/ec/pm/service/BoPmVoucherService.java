package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmVoucherMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmVoucherRepository;
import com.shopjoy.ecadminapi.common.exception.BusinessException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoPmVoucherService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final PmVoucherMapper mapper;
    private final PmVoucherRepository repository;

    @Transactional(readOnly = true)
    public List<PmVoucherDto> list(String siteId, String kw, String status, String dateStart, String dateEnd) {
        Map<String, Object> p = buildParams(siteId, kw, status, dateStart, dateEnd);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PmVoucherDto> page(String siteId, String kw, String status, String dateStart, String dateEnd, int pageNo, int pageSize) {
        Map<String, Object> p = buildParams(siteId, kw, status, dateStart, dateEnd);
        p.put("limit", pageSize);
        p.put("offset", (pageNo - 1) * pageSize);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), pageNo, pageSize, p);
    }

    @Transactional(readOnly = true)
    public PmVoucherDto getById(String id) {
        PmVoucherDto dto = mapper.selectById(id);
        if (dto == null) throw new BusinessException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public PmVoucher create(PmVoucher body) {
        body.setVoucherId("VR" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.currentUserId());
        body.setRegDate(LocalDateTime.now());
        return repository.save(body);
    }

    @Transactional
    public PmVoucherDto update(String id, PmVoucher body) {
        PmVoucher entity = repository.findById(id).orElseThrow(() -> new BusinessException("존재하지 않는 데이터입니다: " + id));
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        repository.save(entity);
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) throw new BusinessException("존재하지 않는 데이터입니다: " + id);
        repository.deleteById(id);
    }

    @Transactional
    public PmVoucherDto changeStatus(String id, String statusCd) {
        PmVoucher entity = repository.findById(id).orElseThrow(() -> new BusinessException("존재하지 않습니다: " + id));
        entity.setVoucherStatusCdBefore(entity.getVoucherStatusCd());
        entity.setVoucherStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        repository.save(entity);
        return getById(id);
    }

    private Map<String, Object> buildParams(String siteId, String kw, String status, String dateStart, String dateEnd) {
        Map<String, Object> p = new HashMap<>();
        if (siteId != null && !siteId.isBlank()) p.put("siteId", siteId);
        if (kw != null && !kw.isBlank()) p.put("kw", kw);
        if (status != null && !status.isBlank()) p.put("status", status);
        if (dateStart != null && !dateStart.isBlank()) p.put("dateStart", dateStart);
        if (dateEnd != null && !dateEnd.isBlank()) p.put("dateEnd", dateEnd);
        return p;
    }
}
