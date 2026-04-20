package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpUiMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpUiRepository;
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
public class BoDpUiService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final DpUiMapper mapper;
    private final DpUiRepository repository;

    @Transactional(readOnly = true)
    public List<DpUiDto> list(String siteId, String kw) {
        Map<String, Object> p = buildParams(siteId, kw);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<DpUiDto> page(String siteId, String kw, int pageNo, int pageSize) {
        Map<String, Object> p = buildParams(siteId, kw);
        p.put("limit", pageSize);
        p.put("offset", (pageNo - 1) * pageSize);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), pageNo, pageSize, p);
    }

    @Transactional(readOnly = true)
    public DpUiDto getById(String id) {
        DpUiDto dto = mapper.selectById(id);
        if (dto == null) throw new BusinessException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public DpUi create(DpUi body) {
        body.setUiId("UI" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.currentUserId());
        body.setRegDate(LocalDateTime.now());
        return repository.save(body);
    }

    @Transactional
    public DpUiDto update(String id, DpUi body) {
        DpUi entity = repository.findById(id).orElseThrow(() -> new BusinessException("존재하지 않는 데이터입니다: " + id));
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

    private Map<String, Object> buildParams(String siteId, String kw) {
        Map<String, Object> p = new HashMap<>();
        if (siteId != null && !siteId.isBlank()) p.put("siteId", siteId);
        if (kw != null && !kw.isBlank()) p.put("kw", kw);
        return p;
    }
}
