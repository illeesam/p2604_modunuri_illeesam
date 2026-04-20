package com.shopjoy.ecadminapi.bo.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmChattRoomMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattRoomRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoCmChattService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final CmChattRoomMapper mapper;
    private final CmChattRoomRepository repository;

    @Transactional(readOnly = true)
    public List<CmChattRoomDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<CmChattRoomDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public CmChattRoomDto getById(String id) {
        CmChattRoomDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public CmChattRoom create(CmChattRoom body) {
        body.setChattRoomId("CR" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.currentUserId());
        body.setRegDate(LocalDateTime.now());
        return repository.save(body);
    }

    @Transactional
    public CmChattRoomDto update(String id, CmChattRoom body) {
        CmChattRoom entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
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

    @Transactional
    public CmChattRoomDto changeStatus(String id, String statusCd) {
        CmChattRoom entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setChattStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        repository.save(entity);
        return getById(id);
    }
}
