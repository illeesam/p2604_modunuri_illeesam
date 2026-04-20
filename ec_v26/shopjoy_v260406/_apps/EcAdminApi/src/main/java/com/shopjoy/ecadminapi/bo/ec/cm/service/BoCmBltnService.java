package com.shopjoy.ecadminapi.bo.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltn;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBltnMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBltnRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
public class BoCmBltnService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final CmBltnMapper mapper;
    private final CmBltnRepository repository;

    @Transactional(readOnly = true)
    public List<CmBltnDto> getList(String siteId, String kw, String dateStart, String dateEnd) {
        Map<String, Object> p = buildParams(siteId, kw, dateStart, dateEnd);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<CmBltnDto> getPageData(String siteId, String kw, String dateStart, String dateEnd, int pageNo, int pageSize) {
        Map<String, Object> p = buildParams(siteId, kw, dateStart, dateEnd);
        p.put("limit", pageSize);
        p.put("offset", (pageNo - 1) * pageSize);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), pageNo, pageSize, p);
    }

    @Transactional(readOnly = true)
    public CmBltnDto getById(String id) {
        CmBltnDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public CmBltn create(CmBltn body) {
        body.setBlogId("BL" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.currentUserId());
        body.setRegDate(LocalDateTime.now());
        return repository.save(body);
    }

    @Transactional
    public CmBltnDto update(String id, CmBltn body) {
        CmBltn entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        repository.save(entity);
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
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
