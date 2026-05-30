package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattMsgRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmChattMsgService {

    private final CmChattMsgRepository cmChattMsgRepository;

    @PersistenceContext
    private EntityManager em;

    /* 채팅 메시지 키조회 */
    public CmChattMsgDto.Item getById(String id) {
        CmChattMsgDto.Item dto = cmChattMsgRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmChattMsgDto.Item getByIdOrNull(String id) {
        return cmChattMsgRepository.selectById(id).orElse(null);
    }

    /* 채팅 메시지 상세조회 */
    public CmChattMsg findById(String id) {
        return cmChattMsgRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmChattMsg findByIdOrNull(String id) {
        return cmChattMsgRepository.findById(id).orElse(null);
    }

    /* 채팅 메시지 키검증 */
    public boolean existsById(String id) {
        return cmChattMsgRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmChattMsgRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 채팅 메시지 목록조회 */
    public List<CmChattMsgDto.Item> getList(CmChattMsgDto.Request req) {
        return cmChattMsgRepository.selectList(req);
    }

    /* 채팅 메시지 페이지조회 */
    public CmChattMsgDto.PageResponse getPageData(CmChattMsgDto.Request req) {
        PageHelper.addPaging(req);
        return cmChattMsgRepository.selectPageList(req);
    }

    /* 채팅 메시지 등록 */
    @Transactional
    public CmChattMsg create(CmChattMsg body) {
        body.setChattMsgId(CmUtil.generateId("cm_chatt_msg"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmChattMsg saved = cmChattMsgRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 채팅 메시지 수정 */
    @Transactional
    public CmChattMsg update(String id, CmChattMsg body) {
        CmUtil.requireId(id, "id", this);
        CmChattMsg entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "chattMsgId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattMsg saved = cmChattMsgRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 채팅 메시지 수정 */
    @Transactional
    public CmChattMsg updateSelective(CmChattMsg entity) {
        if (entity.getChattMsgId() == null) throw new CmBizException("chattMsgId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getChattMsgId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getChattMsgId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmChattMsgRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 채팅 메시지 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        CmChattMsg entity = findById(id);
        cmChattMsgRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public CmChattMsg save(String cmd, CmChattMsg entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getChattMsgId() == null || entity.getChattMsgId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getChattMsgId() == null)
                    throw new CmBizException("삭제 대상 chattMsgId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!cmChattMsgRepository.existsById(entity.getChattMsgId()))
                    throw new CmBizException("존재하지 않는 CmChattMsg입니다: " + entity.getChattMsgId() + "::" + CmUtil.svcCallerInfo(this));
                cmChattMsgRepository.deleteById(entity.getChattMsgId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setChattMsgId(CmUtil.generateId("cm_chatt_msg"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                CmChattMsg saved = cmChattMsgRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getChattMsgId() == null)
                    throw new CmBizException("수정 대상 chattMsgId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = cmChattMsgRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 CmChattMsg입니다: " + entity.getChattMsgId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getChattMsgId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<CmChattMsg> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (CmChattMsg row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getChattMsgId() == null || row.getChattMsgId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, CmChattMsg::getChattMsgId, "U", "chattMsgId", this);
            CmUtil.requireRowIds(rows, CmChattMsg::getChattMsgId, "D", "chattMsgId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(CmChattMsg::getChattMsgId)
                .toList();
            if (!deleteIds.isEmpty()) {
                cmChattMsgRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<CmChattMsg> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (CmChattMsg row : updateRows) {
                row.setUpdBy(authId);
                int affected = cmChattMsgRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getChattMsgId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<CmChattMsg> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (CmChattMsg row : insertRows) {
                row.setChattMsgId(CmUtil.generateId("cm_chatt_msg"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                cmChattMsgRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
