package com.shopjoy.ecadminapi.bo.ec.cm.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.mapper.SyNoticeMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyNoticeRepository;
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
public class BoCmNoticeService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyNoticeMapper mapper;
    private final SyNoticeRepository repository;

    @Transactional(readOnly = true)
    public List<SyNoticeDto> list(String siteId, String kw, String dateStart, String dateEnd) {
        Map<String, Object> p = buildParams(siteId, kw, dateStart, dateEnd);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyNoticeDto> page(String siteId, String kw, String dateStart, String dateEnd, int pageNo, int pageSize) {
        Map<String, Object> p = buildParams(siteId, kw, dateStart, dateEnd);
        p.put("limit", pageSize);
        p.put("offset", (pageNo - 1) * pageSize);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), pageNo, pageSize, p);
    }

    @Transactional(readOnly = true)
    public SyNoticeDto getById(String id) {
        SyNoticeDto dto = mapper.selectById(id);
        if (dto == null) throw new BusinessException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyNotice create(SyNotice body) {
        body.setNoticeId("NT" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.currentUserId());
        body.setRegDate(LocalDateTime.now());
        return repository.save(body);
    }

    @Transactional
    public SyNoticeDto update(String id, SyNotice body) {
        SyNotice entity = repository.findById(id).orElseThrow(() -> new BusinessException("존재하지 않는 데이터입니다: " + id));
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

    private Map<String, Object> buildParams(String siteId, String kw, String dateStart, String dateEnd) {
        Map<String, Object> p = new HashMap<>();
        if (siteId != null && !siteId.isBlank()) p.put("siteId", siteId);
        if (kw != null && !kw.isBlank()) p.put("kw", kw);
        if (dateStart != null && !dateStart.isBlank()) p.put("dateStart", dateStart);
        if (dateEnd != null && !dateEnd.isBlank()) p.put("dateEnd", dateEnd);
        return p;
    }
}
